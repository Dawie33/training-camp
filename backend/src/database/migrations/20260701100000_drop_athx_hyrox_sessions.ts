import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('athx_sessions')
  await knex.schema.dropTableIfExists('hyrox_sessions')
}

export async function down(_knex: Knex): Promise<void> {}
