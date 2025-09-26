import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_sport_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));    
    // Relations
    table.uuid('user_id').notNullable()
    .references('id').inTable('users')
    .onDelete('CASCADE');
      table.uuid('sport_id').notNullable()
    .references('id').inTable('sports')
    .onDelete('CASCADE');

    // Niveau spécifique au sport
    table.enum('sport_level', ['beginner', 'intermediate', 'advanced', 'elite']).notNullable();
    table.decimal('experience_years', 4, 1).nullable(); // Années de pratique
    
    // Objectifs spécifiques au sport
    table.json('sport_specific_goals').nullable();
    
    // Performances de référence
    table.json('personal_records').nullable(); // PRs spécifiques au sport
    table.json('benchmark_results').nullable(); // Résultats tests de référence
    
    // Préférences sport-spécifiques
    table.json('training_preferences').nullable(); // Volume, intensité, type d'entraînement
    table.json('equipment_preferences').nullable(); // Équipement préféré pour ce sport
    
    // Statut
    table.boolean('is_primary_sport').defaultTo(false); // Sport principal
    table.boolean('is_active').defaultTo(true); // Pratique actuellement
    table.timestamp('started_at').nullable(); // Début de pratique
    table.timestamp('last_activity_at').nullable(); // Dernière activité
    
    table.timestamps(true, true);
  
    // Contraintes
    table.unique(['user_id', 'sport_id']);
    
    // Index
    table.index(['user_id']);
    table.index(['sport_id']);
    table.index(['is_primary_sport']);
    table.index(['is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_sport_profiles');
}