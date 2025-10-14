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
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Running',
      slug: 'running',
      category: 'endurance',
      common_metrics: JSON.stringify(['distance', 'time', 'pace']),
      equipment_categories: JSON.stringify(['shoes', 'watch']),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Cycling',
      slug: 'cycling',
      category: 'endurance',
      common_metrics: JSON.stringify(['distance', 'time', 'speed', 'power']),
      equipment_categories: JSON.stringify(['bike', 'indoor_bike']),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Weightlifting',
      slug: 'musculation',
      category: 'strength',
      common_metrics: JSON.stringify(['reps', 'sets', 'weight']),
      equipment_categories: JSON.stringify(['barbell', 'dumbbells', 'machines', 'bench']),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Cross Training',
      slug: 'cross-training',
      category: 'mixed',
      common_metrics: JSON.stringify(['reps', 'rounds', 'time', 'heart_rate']),
      equipment_categories: JSON.stringify(['dumbbells', 'kettlebell', 'box', 'jump_rope', 'battle_rope', 'rower', 'bike', 'skierg', 'medicine_ball']),
      description: 'Entraînement croisé mêlant cardio, force, mobilité et endurance. Utilise différentes disciplines pour un développement physique complet.',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ])
}