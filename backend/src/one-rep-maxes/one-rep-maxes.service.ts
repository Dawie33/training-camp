import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'

@Injectable()
export class OneRepMaxesService {
  constructor(@InjectModel() private readonly knex: Knex) {}

  async findAllByUser(userId: string) {
    return this.knex('one_rep_maxes').where({ user_id: userId }).orderBy('lift')
  }

  async upsert(userId: string, lift: string, value: number, source: 'real' | 'estimated') {
    const [row] = await this.knex('one_rep_maxes')
      .insert({ user_id: userId, lift, value, source, measured_at: this.knex.fn.now() })
      .onConflict(['user_id', 'lift'])
      .merge(['value', 'source', 'measured_at'])
      .returning('*')
    return row
  }
}
