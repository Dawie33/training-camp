import type { Knex } from "knex"

export async function seed(knex: Knex): Promise<void> {
  await knex('workouts').del();

  // Get CrossFit sport_id
  const crossfitSport = await knex('sports').where({ name: 'Crossfit' }).first();

  await knex('workouts').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Cindy',
      slug: 'cindy',
      description: 'AMRAP 20 min: 5 Pull-Ups, 10 Push-Ups, 15 Air Squats',
      workout_type: 'amrap',
      sport_id: crossfitSport?.id || null,
      blocks: JSON.stringify({
        metcon: {
          type: 'amrap',
          duration: 20,
          parts: [
            { exercise: 'Pull-Up', reps: 5 },
            { exercise: 'Push-Up', reps: 10 },
            { exercise: 'Air Squat', reps: 15 }
          ]
        }
      }),
      estimated_duration: 20,
      intensity: 'high',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['push-ups sur genoux']),
      equipment_required: JSON.stringify(['pull-up bar']),
      focus_areas: JSON.stringify(['endurance', 'gymnastics']),
      metrics_tracked: JSON.stringify(['rounds', 'reps']),
      ai_generated: false,
      ai_parameters: null,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'rounds' }),
      usage_count: 0,
      average_rating: null,
      total_ratings: 0,
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: true,
      coach_notes: null,
      tags: JSON.stringify(['bodyweight', 'classic']),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}