import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('strength_sessions', (table) => {
    table.enum('body_focus', ['upper_body', 'lower_body', 'full_body']).nullable()
    table.enum('training_style', ['traditional', 'strongman']).notNullable().defaultTo('traditional')
    table.index(['body_focus'], 'idx_strength_sessions_body_focus')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('strength_sessions', (table) => {
    table.dropIndex(['body_focus'], 'idx_strength_sessions_body_focus')
    table.dropColumn('body_focus')
    table.dropColumn('training_style')
  })
}
