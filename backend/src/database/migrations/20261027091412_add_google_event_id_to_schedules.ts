import type { Knex } from 'knex'

/**
 * Garde l'id de l'événement Google Agenda créé pour chaque séance planifiée.
 *
 * Sans lui, déplacer ou supprimer une séance laissait l'ancien événement dans l'agenda de l'athlète
 * (événement orphelin). Null quand l'agenda n'est pas connecté ou que la création a échoué côté Google.
 */
const TABLES = ['user_workout_schedule', 'scheduled_activities']

export async function up(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    await knex.schema.alterTable(tableName, table => {
      table.string('google_event_id').nullable()
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    await knex.schema.alterTable(tableName, table => {
      table.dropColumn('google_event_id')
    })
  }
}
