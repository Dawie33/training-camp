import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('daily_coach_operations', table => {
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.date('day').notNullable()
    table.string('operation', 20).notNullable()
    table.integer('attempts').notNullable().defaultTo(0)
    table.uuid('claim_id').nullable()
    table.timestamp('retry_at', { useTz: true }).nullable()
    table.timestamp('lease_until', { useTz: true }).nullable()
    table.jsonb('result').nullable()
    table.primary(['user_id', 'day', 'operation'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('daily_coach_operations')
}
