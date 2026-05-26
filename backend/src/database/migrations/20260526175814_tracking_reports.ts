import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tracking_reports', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('sport', 20).notNullable()
    table.integer('period_months').notNullable()
    table.jsonb('report').notNullable()
    table.timestamp('generated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.unique(['user_id', 'sport'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tracking_reports')
}
