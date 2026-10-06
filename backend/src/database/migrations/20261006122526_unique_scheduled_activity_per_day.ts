import type { Knex } from 'knex'

/**
 * Une seule activité d'un même type par jour et par utilisateur.
 * Le service le vérifiait avant d'insérer, mais deux requêtes simultanées (double clic)
 * pouvaient passer toutes les deux : seule une contrainte en base l'empêche réellement.
 * Vérifié avant de l'ajouter : aucun doublon en production (2026-10-06).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE UNIQUE INDEX scheduled_activities_user_date_type_unique
    ON scheduled_activities (user_id, scheduled_date, activity_type)
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS scheduled_activities_user_date_type_unique')
}
