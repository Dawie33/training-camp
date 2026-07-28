import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('biking_sessions', (table) => {
    table.enum('location_type', ['indoor', 'outdoor']).notNullable().defaultTo('outdoor')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('biking_sessions', (table) => {
    table.dropColumn('location_type')
  })
}
