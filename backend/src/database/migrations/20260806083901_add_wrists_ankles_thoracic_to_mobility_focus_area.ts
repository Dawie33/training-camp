import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE mobility_sessions
    DROP CONSTRAINT mobility_sessions_focus_area_check,
    ADD CONSTRAINT mobility_sessions_focus_area_check
      CHECK (focus_area IN ('hips', 'shoulders', 'hips_shoulders', 'wrists', 'ankles', 'thoracic_spine', 'full_body'))
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE mobility_sessions
    DROP CONSTRAINT mobility_sessions_focus_area_check,
    ADD CONSTRAINT mobility_sessions_focus_area_check
      CHECK (focus_area IN ('hips', 'shoulders', 'hips_shoulders', 'full_body'))
  `)
}
