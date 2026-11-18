import { ConflictException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'

type Operation = 'recommendation' | 'session' | 'proposal'

@Injectable()
export class DailyCoachStore {
  private readonly logger = new Logger(DailyCoachStore.name)

  constructor(@InjectModel() private readonly knex: Knex) {}

  /**
   * Persistent claims fence late workers; AI runs outside the transaction.
   * Ten minutes covers both AI calls (120s timeout, one retry each).
   */
  async run<T>(
    userId: string,
    day: string,
    operation: Operation,
    prepare: () => Promise<(trx: Knex.Transaction) => Promise<T>>,
    replay?: (trx: Knex.Transaction, result: T) => Promise<T>
  ): Promise<T> {
    const key = { user_id: userId, day, operation }
    await this.knex('daily_coach_operations').insert(key).onConflict(['user_id', 'day', 'operation']).ignore()
    const claimId = randomUUID()
    const [claim] = await this.knex('daily_coach_operations')
      .where(key)
      .whereNull('result')
      .where('attempts', '<', 3)
      .where(builder => builder.whereNull('retry_at').orWhere('retry_at', '<=', this.knex.fn.now()))
      .where(builder => builder.whereNull('lease_until').orWhere('lease_until', '<=', this.knex.fn.now()))
      .update({
        claim_id: claimId,
        attempts: this.knex.raw('attempts + 1'),
        lease_until: this.knex.raw("CURRENT_TIMESTAMP + INTERVAL '10 minutes'"),
      })
      .returning('*')

    if (!claim) {
      const row = await this.knex('daily_coach_operations').where(key).first()
      if (row?.result != null) {
        const result = row.result as T
        return replay ? this.knex.transaction(trx => replay(trx, result)) : result
      }
      throw new ConflictException('Coach déjà en cours, en attente ou limite quotidienne atteinte')
    }

    try {
      const finish = await prepare()
      return await this.knex.transaction(async trx => {
        const row = await trx('daily_coach_operations').where(key).forUpdate().first()
        if (row?.claim_id !== claimId) {
          throw new ConflictException('Tentative du coach remplacée')
        }
        const result = await finish(trx)
        await trx('daily_coach_operations')
          .where(key)
          .update({ result: JSON.stringify(result), claim_id: null, lease_until: null })
        return result
      })
    } catch (error) {
      this.logger.warn(`Coach ${operation} échoué pour ${userId} (${day})`)
      try {
        await this.knex('daily_coach_operations')
          .where(key)
          .where({ claim_id: claimId })
          .update({
            claim_id: null,
            lease_until: null,
            retry_at: this.knex.raw("CURRENT_TIMESTAMP + INTERVAL '10 minutes'"),
          })
      } catch (persistenceError) {
        this.logger.error('Impossible de libérer la tentative du coach', persistenceError)
        throw new ServiceUnavailableException('Coach temporairement indisponible')
      }
      throw error
    }
  }
}
