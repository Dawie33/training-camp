import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('benchmark_history', table => {
    // Les mesures historiques sans lien certain restent intactes.
    table.uuid('session_id').nullable().references('id').inTable('workout_sessions').onDelete('CASCADE').unique()
  })
  await knex.schema.alterTable('workouts', table => {
    table.dropUnique(['scheduled_date'])
  })
}

export async function down(knex: Knex): Promise<void> {
  // Ne pas effacer de workouts si plusieurs partagent désormais une date :
  // le rollback échoue explicitement tant que ces dates ne sont pas arbitrées.
  await knex.schema.alterTable('workouts', table => {
    table.unique(['scheduled_date'])
  })
  await knex.schema.alterTable('benchmark_history', table => {
    table.dropColumn('session_id')
  })
}
