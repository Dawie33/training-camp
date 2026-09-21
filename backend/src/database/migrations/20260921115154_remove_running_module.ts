import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Retire les créneaux planifiés de type running avant de resserrer la contrainte
  await knex('scheduled_activities').where('activity_type', 'running').delete()

  await knex('tracking_reports').where('sport', 'running').delete()

  await knex.schema.dropTableIfExists('running_sessions')

  await knex.raw(`
    ALTER TABLE scheduled_activities
    DROP CONSTRAINT scheduled_activities_activity_type_check,
    ADD CONSTRAINT scheduled_activities_activity_type_check
      CHECK (activity_type IN ('strength', 'biking', 'skill', 'mobility', 'wod', 'conditioning'))
  `)

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('strava_refresh_token')
    table.dropColumn('strava_athlete_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.text('strava_refresh_token').nullable()
    table.bigInteger('strava_athlete_id').nullable()
  })

  await knex.raw(`
    ALTER TABLE scheduled_activities
    DROP CONSTRAINT scheduled_activities_activity_type_check,
    ADD CONSTRAINT scheduled_activities_activity_type_check
      CHECK (activity_type IN ('running', 'strength', 'biking', 'skill', 'mobility', 'wod', 'conditioning'))
  `)

  await knex.schema.createTable('running_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('scheduled_activity_id').nullable().references('id').inTable('scheduled_activities').onDelete('SET NULL')

    table.date('session_date').notNullable()
    table.enum('run_type', ['easy', 'tempo', 'intervals', 'long_run', 'fartlek', 'recovery', 'race']).notNullable()
    table.enum('source', ['manual', 'ai_generated', 'strava']).notNullable().defaultTo('manual')

    table.decimal('distance_km', 6, 2).nullable()
    table.integer('duration_seconds').nullable()
    table.integer('avg_pace_seconds_per_km').nullable()
    table.integer('avg_heart_rate').nullable()
    table.integer('max_heart_rate').nullable()
    table.integer('elevation_gain_m').nullable()
    table.integer('calories').nullable()
    table.integer('perceived_effort').nullable()

    table.jsonb('ai_plan').nullable()
    table.text('strava_activity_id').nullable().unique()

    table.text('notes').nullable()
    table.timestamps(true, true)

    table.index(['user_id'], 'idx_running_sessions_user_id')
    table.index(['session_date'], 'idx_running_sessions_date')
    table.index(['user_id', 'session_date'], 'idx_running_sessions_user_date')
    table.index(['source'], 'idx_running_sessions_source')
  })
}
