import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // workout_bases
  await knex.schema.alterTable('workout_bases', (table) => {
    table.uuid('sport_id')
      .nullable()
      .references('id')
      .inTable('sports')
      .onDelete('SET NULL');
    table.unique(['wod_date', 'sport_id']); // 1 WOD par jour et par sport
  });

  // personalized_workouts
  await knex.schema.alterTable('personalized_workouts', (table) => {
    table.uuid('sport_id')
      .nullable()
      .references('id')
      .inTable('sports')
      .onDelete('SET NULL');
    table.index(['user_id', 'wod_date', 'sport_id'], 'idx_personalized_user_date_sport');
  });

  // workout_logs
  await knex.schema.alterTable('workout_logs', (table) => {
    table.uuid('sport_id')
      .nullable()
      .references('id')
      .inTable('sports')
      .onDelete('SET NULL');
    table.index(['user_id', 'wod_date', 'sport_id'], 'idx_logs_user_date_sport');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workout_bases', (table) => {
    table.dropUnique(['wod_date', 'sport_id']);
    table.dropColumn('sport_id');
  });

  await knex.schema.alterTable('personalized_workouts', (table) => {
    table.dropIndex(['user_id', 'wod_date', 'sport_id'], 'idx_personalized_user_date_sport');
    table.dropColumn('sport_id');
  });

  await knex.schema.alterTable('workout_logs', (table) => {
    table.dropIndex(['user_id', 'wod_date', 'sport_id'], 'idx_logs_user_date_sport');
    table.dropColumn('sport_id');
  });
}
