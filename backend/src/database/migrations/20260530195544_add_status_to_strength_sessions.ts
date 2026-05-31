import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('strength_sessions', (table) => {
    table
      .enum('status', ['planned', 'completed', 'skipped'])
      .notNullable()
      .defaultTo('completed')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('strength_sessions', (table) => {
    table.dropColumn('status')
  })
}
