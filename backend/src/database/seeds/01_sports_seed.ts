import type { Knex } from "knex"

export async function seed(knex: Knex): Promise<void> {

  await knex('sports').del();
  await knex('sports').insert([
    {

      name: 'CrossFit',
      slug: 'crossfit',
      icon: '🏋️‍♂️',
      description: 'Entraînement fonctionnel haute intensité',
      category: 'mixed',
      common_metrics: JSON.stringify(['reps', 'time', 'weight']),
      equipment_categories: JSON.stringify(['barbell', 'pull-up bar', 'rower']),
      isActive: true,
      requires_premium: false,
      sort_order: 1
    },
    {

      name: 'Running',
      slug: 'running',
      icon: '🏃‍♂️',
      description: 'Course à pied sur route ou sentier',
      category: 'endurance',
      common_metrics: JSON.stringify(['distance', 'time', 'pace']),
      equipment_categories: JSON.stringify(['shoes']),
      isActive: true,
      requires_premium: false,
      sort_order: 2
    },
    {

      name: 'Cycling',
      slug: 'cycling',
      icon: '🚴‍♂️',
      description: 'Cyclisme sur route ou VTT',
      category: 'endurance',
      common_metrics: JSON.stringify(['distance', 'time', 'speed']),
      equipment_categories: JSON.stringify(['bike', 'helmet']),
      isActive: true,
      requires_premium: false,
      sort_order: 3
    }
  ]);
}