import { Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { UserContextService } from 'src/user-context/user-context.service'
import { toDateOnly, toParisDate } from '../common/utils/date-only'
import type { OneRepMaxLift, OneRepMaxSource } from './one-rep-max.constants'

@Injectable()
export class OneRepMaxesService {
  constructor(
    @InjectModel() private readonly knex: Knex,
    private readonly userContextService: UserContextService
  ) {}

  async findAllByUser(userId: string) {
    const rows = await this.knex('one_rep_maxes').where({ user_id: userId }).orderBy('lift')
    return rows.map(row => ({ ...row, measured_at: toDateOnly(row.measured_at) }))
  }

  async upsert(userId: string, lift: OneRepMaxLift, value: number, source: OneRepMaxSource, measuredAt?: string) {
    const row = await this.knex.transaction(async trx => {
      await this.lockUser(trx, userId)
      await trx('one_rep_max_history').insert({
        user_id: userId,
        lift,
        value,
        source,
        measured_at: measuredAt ? new Date(measuredAt) : trx.fn.now(),
      })

      return this.recalculateCurrent(trx, userId, lift)
    })

    // Après la validation de la transaction : le cache IA ne doit pas refléter une écriture annulée
    this.userContextService.invalidateCache(userId)

    return row
  }

  async deleteHistory(userId: string, id: string) {
    await this.knex.transaction(async trx => {
      await this.lockUser(trx, userId)
      const [deleted] = await trx('one_rep_max_history').where({ id, user_id: userId }).delete().returning('lift')
      if (!deleted) throw new NotFoundException('Relevé 1RM introuvable')
      await this.recalculateCurrent(trx, userId, deleted.lift)
    })
    this.userContextService.invalidateCache(userId)
  }

  private async lockUser(trx: Knex.Transaction, userId: string) {
    // Le courant peut être absent : verrouiller l'athlète sérialise aussi la première insertion.
    await trx('users').where({ id: userId }).select('id').forUpdate().first()
  }

  private async recalculateCurrent(trx: Knex.Transaction, userId: string, lift: OneRepMaxLift) {
    const latest = await trx('one_rep_max_history')
      .where({ user_id: userId, lift })
      .orderBy('measured_at', 'desc')
      .orderBy('insertion_order', 'desc')
      .first()
    if (!latest) {
      await trx('one_rep_maxes').where({ user_id: userId, lift }).delete()
      return
    }
    const [current] = await trx('one_rep_maxes')
      .insert({
        user_id: userId,
        lift,
        value: latest.value,
        source: latest.source,
        measured_at: toParisDate(latest.measured_at),
      })
      .onConflict(['user_id', 'lift'])
      .merge(['value', 'source', 'measured_at'])
      .returning('*')
    return { ...current, measured_at: toDateOnly(current.measured_at) }
  }

  async findHistoryByUser(userId: string) {
    const rows = await this.knex('one_rep_max_history')
      .where({ user_id: userId })
      .orderBy('measured_at', 'asc')
      .orderBy('insertion_order', 'asc')
      .select('id', 'lift', 'value', 'source', 'measured_at')

    // Grouper par lift : { back_squat: [{ value, measured_at }, ...], ... }
    const grouped: Record<string, { id: string; value: number; source: OneRepMaxSource; measured_at: string }[]> = {}
    for (const row of rows) {
      if (!grouped[row.lift]) grouped[row.lift] = []
      grouped[row.lift].push({ id: row.id, value: Number(row.value), source: row.source, measured_at: row.measured_at })
    }
    return grouped
  }
}
