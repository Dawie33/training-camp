import type { Knex } from 'knex'

/**
 * Ajoute le créneau « Repos » (`session_type = 'rest'`) au calendrier CrossFit. Comme le « Jour box »,
 * c'est un marqueur sans workout. Un jour qui en porte un n'a pas de séance générée par le coach
 * (`DailySessionService` ne génère que les jours sans créneau).
 *
 * `table.enum` a créé une contrainte CHECK : on la remplace par une version qui accepte 'rest'.
 * Le down supprime les créneaux « Repos » (simples marqueurs, sans séance liée) avant de remettre
 * l'ancienne contrainte, qui les refuserait.
 */
const CONSTRAINT = 'user_workout_schedule_session_type_check'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE user_workout_schedule DROP CONSTRAINT IF EXISTS ${CONSTRAINT}`)
  await knex.raw(`
    ALTER TABLE user_workout_schedule
    ADD CONSTRAINT ${CONSTRAINT}
      CHECK (session_type IN ('workout', 'box_session', 'program_session', 'rest'))
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex('user_workout_schedule').where({ session_type: 'rest' }).delete()
  await knex.raw(`ALTER TABLE user_workout_schedule DROP CONSTRAINT IF EXISTS ${CONSTRAINT}`)
  await knex.raw(`
    ALTER TABLE user_workout_schedule
    ADD CONSTRAINT ${CONSTRAINT}
      CHECK (session_type IN ('workout', 'box_session', 'program_session'))
  `)
}
