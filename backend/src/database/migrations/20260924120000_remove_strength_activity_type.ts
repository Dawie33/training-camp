import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Retire les tags « Force » posés par le planificateur de la semaine avant de resserrer la contrainte.
  // Ce sont de simples étiquettes sans contenu : la force se programme désormais comme une section de WOD.
  await knex('scheduled_activities').where('activity_type', 'strength').delete()

  await knex.raw(`
    ALTER TABLE scheduled_activities
    DROP CONSTRAINT scheduled_activities_activity_type_check,
    ADD CONSTRAINT scheduled_activities_activity_type_check
      CHECK (activity_type IN ('skill', 'wod', 'conditioning'))
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE scheduled_activities
    DROP CONSTRAINT scheduled_activities_activity_type_check,
    ADD CONSTRAINT scheduled_activities_activity_type_check
      CHECK (activity_type IN ('strength', 'skill', 'wod', 'conditioning'))
  `)
}
