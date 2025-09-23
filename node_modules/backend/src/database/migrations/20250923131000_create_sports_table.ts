import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('sports', (table) => {
    table.increments('id').primary();
    
    // Informations de base
    table.string('name').notNullable().unique(); // CrossFit, Running, Cycling
    table.string('slug').notNullable().unique(); // crossfit, running, cycling
    table.string('icon').nullable(); // Icône pour l'UI
    table.text('description').nullable();
    
    // Catégorisation
    table.enum('category', [
      'endurance', 'strength', 'mixed', 'team', 'individual', 'water', 'combat'
    ]).notNullable();
    
    // Métriques spécifiques au sport
    table.json('common_metrics').notNullable(); // time, distance, weight, reps, etc.
    table.json('equipment_categories').nullable(); // Types d'équipement pour ce sport
    
    // Configuration
    table.boolean('isActive').defaultTo(true);
    table.boolean('requires_premium').defaultTo(false);
    table.integer('sort_order').defaultTo(0);
    
    table.timestamps(true, true);
    
    table.index(['category']);
    table.index(['isActive']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('sports');
}