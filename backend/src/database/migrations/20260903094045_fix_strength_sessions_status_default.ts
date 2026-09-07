import type { Knex } from 'knex'

// Le défaut initial ('completed') était incorrect pour une séance tout juste générée par l'IA :
// elle n'a pas encore été réalisée. Le statut par défaut doit être 'planned'.
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE strength_sessions ALTER COLUMN status SET DEFAULT 'planned'`)
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE strength_sessions ALTER COLUMN status SET DEFAULT 'completed'`)
}
