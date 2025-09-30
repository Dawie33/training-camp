import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {

  await knex.schema.createTable('workout_bases', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.date('wod_date').notNullable(); // 1 base / jour
    table.string('status').notNullable().defaultTo('draft'); // draft|published
    table.jsonb('blocks_json').notNullable(); // {warmup,strength,metcon,accessory,...}
    table.jsonb('tags_json').notNullable().defaultTo('[]'); // ['strength','lactic','short']
    table.uuid('created_by').nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true); // created_at / updated_at
    table.unique(['wod_date', 'sport_id']);
  });

  // Indexes utiles
  await knex.schema.alterTable('workout_bases', (table) => {
    table.index(['status'], 'idx_workout_bases_status');
    table.index(['wod_date', 'status'], 'idx_workout_bases_date_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('workout_bases');
}
