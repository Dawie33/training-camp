import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('benchmark_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('workout_id').notNullable().references('id').inTable('workouts').onDelete('CASCADE')
    table.string('workout_name').notNullable()
    table.string('score_type').notNullable()
    table.decimal('score_value', 10, 2).notNullable()
    table.integer('extra_reps')
    table.string('calculated_level').notNullable()
    table.string('source').notNullable().defaultTo('manual')
    table.timestamp('measured_at').notNullable().defaultTo(knex.fn.now())
    table.index(['user_id', 'workout_name'], 'idx_benchmark_history_user_workout')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('benchmark_history')
}
