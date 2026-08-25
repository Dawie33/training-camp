import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('mobility_sessions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
        table.uuid('scheduled_activity_id').nullable().references('id').inTable('scheduled_activities').onDelete('SET NULL')
        table.date('session_date').notNullable()
        table.enum('focus_area', ['hips', 'shoulders', 'hips_shoulders', 'wrists', 'ankles', 'thoracic_spine', 'full_body']).notNullable()
        table.enum('goal', ['crossfit_technique', 'relaxation', 'recovery']).notNullable()
        table.string('target_skill').nullable()
        table.enum('source', ['manual', 'ai_generated']).notNullable().defaultTo('manual')
        table.integer('duration_seconds').nullable()
        table.integer('perceived_relief').nullable()
        table.jsonb('ai_plan').nullable()
        table.text('notes').nullable()
        table.timestamps(true, true)

        table.index(['user_id'], 'idx_mobility_sessions_user_id')
        table.index(['user_id', 'session_date'], 'idx_mobility_sessions_user_date')
    })

    await knex.raw(`
    ALTER TABLE scheduled_activities
    DROP CONSTRAINT scheduled_activities_activity_type_check,
    ADD CONSTRAINT scheduled_activities_activity_type_check
      CHECK (activity_type IN ('running', 'strength', 'biking', 'skill', 'mobility'))
  `)
}


export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
    ALTER TABLE scheduled_activities
    DROP CONSTRAINT scheduled_activities_activity_type_check,
    ADD CONSTRAINT scheduled_activities_activity_type_check
      CHECK (activity_type IN ('running', 'strength', 'biking', 'skill'))
  `)

    await knex.schema.dropTableIfExists('mobility_sessions')
}

