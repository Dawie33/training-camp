import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Les anciennes égalités reçoivent un ordre stable, pas leur ordre de saisie perdu.
  await knex.raw('ALTER TABLE one_rep_max_history ADD COLUMN insertion_order bigserial NOT NULL UNIQUE')
  await knex.schema.alterTable('one_rep_max_history', table => {
    table.index(['user_id', 'lift', 'measured_at', 'insertion_order'], 'idx_one_rm_history_latest')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('one_rep_max_history', table => {
    table.dropIndex([], 'idx_one_rm_history_latest')
    table.dropColumn('insertion_order')
  })
}
