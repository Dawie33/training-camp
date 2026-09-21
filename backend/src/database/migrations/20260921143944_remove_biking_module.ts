import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Retire les créneaux planifiés de type biking avant de resserrer la contrainte
  await knex('scheduled_activities').where('activity_type', 'biking').delete()

  await knex('tracking_reports').where('sport', 'biking').delete()

  await knex.schema.dropTableIfExists('biking_sessions')

  await knex.raw(`
    ALTER TABLE scheduled_activities
    DROP CONSTRAINT scheduled_activities_activity_type_check,
    ADD CONSTRAINT scheduled_activities_activity_type_check
      CHECK (activity_type IN ('strength', 'skill', 'mobility', 'wod', 'conditioning'))
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE scheduled_activities
    DROP CONSTRAINT scheduled_activities_activity_type_check,
    ADD CONSTRAINT scheduled_activities_activity_type_check
      CHECK (activity_type IN ('strength', 'biking', 'skill', 'mobility', 'wod', 'conditioning'))
  `)

  await knex.schema.createTable('biking_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('scheduled_activity_id').nullable().references('id').inTable('scheduled_activities').onDelete('SET NULL')
    table.date('session_date').notNullable()
    table.enum('bike_type', ['endurance', 'sweet_spot', 'intervals', 'ftp_test', 'recovery', 'race']).notNullable()
    table.enum('source', ['manual', 'ai_generated']).notNullable().defaultTo('manual')
    table.decimal('distance_km', 8, 2).nullable()
    table.integer('duration_seconds').nullable()
    table.integer('avg_power_watts').nullable()
    table.integer('ftp_watts').nullable()
    table.integer('avg_heart_rate').nullable()
    table.integer('max_heart_rate').nullable()
    table.integer('calories').nullable()
    table.integer('perceived_effort').nullable()
    table.jsonb('ai_plan').nullable()
    table.text('notes').nullable()
    table.timestamps(true, true)
    table.enum('location_type', ['indoor', 'outdoor']).notNullable().defaultTo('outdoor')
  })
}
