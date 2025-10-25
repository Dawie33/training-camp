import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Supprimer toutes les contraintes de clé étrangère existantes
  await knex.raw(`
    DO $$
    DECLARE
        r RECORD;
    BEGIN
        FOR r IN (
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'personalized_workouts'
            AND constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE 'ALTER TABLE personalized_workouts DROP CONSTRAINT IF EXISTS ' || r.constraint_name;
        END LOOP;
    END $$;
  `)

  // Ajouter la nouvelle contrainte de clé étrangère vers workouts (base_id -> workouts.id)
  await knex.raw(`
    ALTER TABLE personalized_workouts
    ADD CONSTRAINT personalized_workouts_base_id_foreign
    FOREIGN KEY (base_id) REFERENCES workouts(id) ON DELETE CASCADE;
  `)

  // Ajouter la contrainte user_id
  await knex.raw(`
    ALTER TABLE personalized_workouts
    ADD CONSTRAINT personalized_workouts_user_id_foreign
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  `)
}

export async function down(knex: Knex): Promise<void> {
  // Supprimer la contrainte de clé étrangère
  await knex.schema.alterTable('personalized_workouts', (table) => {
    table.dropForeign('base_id')
  })

  // Renommer base_id en workout_id
  await knex.schema.alterTable('personalized_workouts', (table) => {
    table.renameColumn('base_id', 'workout_id')
  })

  // Renommer wod_date en date
  await knex.schema.alterTable('personalized_workouts', (table) => {
    table.renameColumn('wod_date', 'date')
  })

  // Re-créer l'ancienne contrainte
  await knex.schema.alterTable('personalized_workouts', (table) => {
    table.foreign('workout_id').references('id').inTable('workout_bases').onDelete('CASCADE')
  })
}
