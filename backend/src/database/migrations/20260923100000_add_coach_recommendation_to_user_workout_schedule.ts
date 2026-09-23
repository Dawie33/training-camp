import type { Knex } from 'knex'

/**
 * Conserve, sur le créneau de la séance du jour, la recommandation du coach qui l'a produite.
 *
 * La recommandation n'est gardée qu'en cache mémoire côté serveur : sans cette trace, l'explication
 * affichée au dashboard pouvait être régénérée et ne plus correspondre à la séance planifiée.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_workout_schedule', (table) => {
    table.jsonb('coach_recommendation').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_workout_schedule', (table) => {
    table.dropColumn('coach_recommendation')
  })
}
