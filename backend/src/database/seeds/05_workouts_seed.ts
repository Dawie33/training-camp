import type { Knex } from "knex"

export async function seed(knex: Knex): Promise<void> {
  await knex('workouts').del();
  await knex('workouts').insert([
    {
      name: 'Cindy',
      slug: 'cindy',
      description: 'AMRAP 20 min: 5 Pull-Ups, 10 Push-Ups, 15 Air Squats',
      type: 'amrap',
      structure: JSON.stringify({
        time_cap: 20,
        rounds: [
          { exercises: [
            { exercise: 'Pull-Up', reps: 5 },
            { exercise: 'Push-Up', reps: 10 },
            { exercise: 'Air Squat', reps: 15 }
          ]}
        ]
      }),
      estimated_duration: 20,
      intensity: 'high',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['push-ups sur genoux']),
      equipment_required: JSON.stringify(['pull-up bar']),
      bodyweight_only: true,
      muscle_groups_targeted: JSON.stringify(['back', 'chest', 'legs']),
      energy_systems: JSON.stringify(['aerobic', 'anaerobic']),
      ai_generated: false,
      ai_parameters: null,
      created_by_user_id: null,
      scoring_type: 'rounds',
      usage_count: 0,
      average_rating: null,
      total_ratings: 0,
      isActive: true,
      isFeatured: false,
      isPublic: true,
      is_benchmark: true,
      is_hero_wod: false,
      coach_notes: null,
      tags: JSON.stringify(['bodyweight', 'classic']),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}