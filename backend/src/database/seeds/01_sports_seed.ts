import { Knex } from 'knex'

export async function seed(knex: Knex): Promise<void> {
  // Supprime les entrées existantes pour éviter les doublons
  await knex('sports').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Crossfit',
      slug: 'crossfit',
      category: 'mixed',
      common_metrics: JSON.stringify(['reps', 'rounds', 'time']),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Running',
      slug: 'running',
      category: 'endurance',
      common_metrics: JSON.stringify(['distance', 'time', 'pace']),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Cycling',
      slug: 'cycling',
      category: 'endurance',
      common_metrics: JSON.stringify(['distance', 'time', 'speed']),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Musculation',
      slug: 'musculation',
      category: 'strength',
      common_metrics: JSON.stringify(['reps', 'sets', 'weight']),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ])
}