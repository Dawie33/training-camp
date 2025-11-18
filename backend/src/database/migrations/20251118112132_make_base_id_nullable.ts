import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Supprimer la contrainte de clé étrangère existante
  await knex.raw(`
    ALTER TABLE personalized_workouts
    DROP CONSTRAINT IF EXISTS personalized_workouts_base_id_foreign;
  `)

  // Modifier la colonne base_id pour qu'elle soit nullable
  await knex.raw(`
    ALTER TABLE personalized_workouts
    ALTER COLUMN base_id DROP NOT NULL;
  `)

  // Re-créer la contrainte de clé étrangère (permettant NULL)
  await knex.raw(`
    ALTER TABLE personalized_workouts
    ADD CONSTRAINT personalized_workouts_base_id_foreign
    FOREIGN KEY (base_id) REFERENCES workouts(id) ON DELETE CASCADE;
  `)
}

export async function down(knex: Knex): Promise<void> {
  // Supprimer la contrainte
  await knex.raw(`
    ALTER TABLE personalized_workouts
    DROP CONSTRAINT IF EXISTS personalized_workouts_base_id_foreign;
  `)

  // Remettre la colonne base_id en NOT NULL
  await knex.raw(`
    ALTER TABLE personalized_workouts
    ALTER COLUMN base_id SET NOT NULL;
  `)

  // Re-créer la contrainte
  await knex.raw(`
    ALTER TABLE personalized_workouts
    ADD CONSTRAINT personalized_workouts_base_id_foreign
    FOREIGN KEY (base_id) REFERENCES workouts(id) ON DELETE CASCADE;
  `)
}
