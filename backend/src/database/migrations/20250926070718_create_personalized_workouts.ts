import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('personalized_workouts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE')
    table.uuid('workout_id').notNullable()
      .references('id').inTable('workout_bases').onDelete('CASCADE')
    table.date('date').notNullable()
    table.jsonb('plan_json').notNullable()   // plan final adapté pour l’utilisateur
    table.jsonb('params_json').notNullable() // snapshot: level, equipment, 1RM, fatigue, time_budget

    table.unique(['user_id', 'date'], { useConstraint: true, indexName: 'uq_personalized_user_date' })
    table.index(['workout_id'], 'idx_personalized_base')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('personalized_workouts')
}
