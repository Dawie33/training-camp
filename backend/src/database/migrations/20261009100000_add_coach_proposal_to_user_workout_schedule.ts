import type { Knex } from 'knex'

/**
 * Conserve la proposition du coach quand le créneau du jour est occupé par une autre séance.
 *
 * Un seul créneau par jour : si l'athlète a planifié sa propre séance, le WOD du coach ne peut pas
 * y prendre place. Il est généré à la demande et gardé ici, pour ne pas rappeler OpenAI à chaque visite.
 * Distinct de `coach_recommendation`, qui explique la séance du créneau elle-même.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_workout_schedule', table => {
    table.jsonb('coach_proposal').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_workout_schedule', table => {
    table.dropColumn('coach_proposal')
  })
}
