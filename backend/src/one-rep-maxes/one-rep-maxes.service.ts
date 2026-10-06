import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { UserContextService } from 'src/workouts/services/user-context.service'
import type { OneRepMaxLift } from './one-rep-max.constants'

@Injectable()
export class OneRepMaxesService {
  constructor(
    @InjectModel() private readonly knex: Knex,
    private readonly userContextService: UserContextService
  ) {}

  async findAllByUser(userId: string) {
    return this.knex('one_rep_maxes').where({ user_id: userId }).orderBy('lift')
  }

  /**
   * Enregistre le 1RM courant et l'ajoute à l'historique.
   * Les deux écritures sont dans une transaction : sinon, un échec de la seconde laisserait
   * un 1RM à jour sans point correspondant sur la courbe de progression.
   */
  async upsert(userId: string, lift: OneRepMaxLift, value: number, source: 'real' | 'estimated') {
    const row = await this.knex.transaction(async trx => {
      const [current] = await trx('one_rep_maxes')
        .insert({ user_id: userId, lift, value, source, measured_at: trx.fn.now() })
        .onConflict(['user_id', 'lift'])
        .merge(['value', 'source', 'measured_at'])
        .returning('*')

      await trx('one_rep_max_history').insert({
        user_id: userId,
        lift,
        value,
        source,
        measured_at: trx.fn.now(),
      })

      return current
    })

    // Après la validation de la transaction : le cache IA ne doit pas refléter une écriture annulée
    this.userContextService.invalidateCache(userId)

    return row
  }

  async findHistoryByUser(userId: string) {
    const rows = await this.knex('one_rep_max_history')
      .where({ user_id: userId })
      .orderBy('measured_at', 'asc')
      .select('lift', 'value', 'source', 'measured_at')

    // Grouper par lift : { back_squat: [{ value, measured_at }, ...], ... }
    const grouped: Record<string, { value: number; source: string; measured_at: string }[]> = {}
    for (const row of rows) {
      if (!grouped[row.lift]) grouped[row.lift] = []
      grouped[row.lift].push({ value: Number(row.value), source: row.source, measured_at: row.measured_at })
    }
    return grouped
  }
}
