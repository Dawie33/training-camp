import { Knex } from 'knex'

export async function seed(knex: Knex): Promise<void> {
  // Supprime les entrées existantes pour éviter les doublons
  await knex('sports').del()

  await knex('sports').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Crossfit',
      slug: 'crossfit',
      category: 'mixed',
      common_metrics: JSON.stringify(['reps', 'rounds', 'time']),
      equipment_categories: JSON.stringify(['barbell', 'dumbbells', 'kettlebell', 'pullup_bar', 'box', 'rower', 'bike', 'skierg']),
      description: 'Entraînement fonctionnel à haute intensité combinant gymnastique, haltérophilie et cardio.',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ])
}