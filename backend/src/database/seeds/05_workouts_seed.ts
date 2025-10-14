import type { Knex } from "knex"

export async function seed(knex: Knex): Promise<void> {
  await knex('workouts').del();

  // Get sports IDs
  const crossfitSport = await knex('sports').where({ slug: 'crossfit' }).first();
  const runningSport = await knex('sports').where({ slug: 'running' }).first();
  const musculationSport = await knex('sports').where({ slug: 'musculation' }).first();

  const workouts = [
    // ============================================================================
    // CROSSFIT WORKOUTS
    // ============================================================================
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Cindy',
      slug: 'cindy',
      description: 'AMRAP 20 min: 5 Pull-Ups, 10 Push-Ups, 15 Air Squats',
      workout_type: 'amrap',
      sport_id: crossfitSport?.id || null,
      blocks: JSON.stringify({
        duration_min: 20,
        stimulus: 'Endurance musculaire et cardio',
        warmup: [
          { movement: 'Jump Rope', duration_sec: 180 },
          { movement: 'Shoulder Circles', reps: 10 }
        ],
        metcon: {
          format: 'AMRAP',
          duration_min: 20,
          parts: [
            { movement: 'Pull-Up', reps: 5 },
            { movement: 'Push-Up', reps: 10 },
            { movement: 'Air Squat', reps: 15 }
          ]
        },
        cooldown: [
          { movement: 'Walk', duration_sec: 300 }
        ]
      }),
      estimated_duration: 30,
      intensity: 'high',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['banded pull-ups', 'knee push-ups']),
      equipment_required: JSON.stringify(['pull-up-bar']),
      focus_areas: JSON.stringify(['endurance', 'gymnastics']),
      metrics_tracked: JSON.stringify(['rounds', 'reps']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'rounds' }),
      isActive: true,
      isFeatured: true,
      isPublic: true,
      status: 'published',
      is_benchmark: true,
      coach_notes: 'Workout benchmark classique. Visez un rythme constant.',
      tags: JSON.stringify(['bodyweight', 'classic', 'benchmark']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Fran',
      slug: 'fran',
      description: '21-15-9 Thrusters (95/65 lbs) et Pull-Ups',
      workout_type: 'for_time',
      sport_id: crossfitSport?.id || null,
      blocks: JSON.stringify({
        duration_min: 15,
        stimulus: 'Sprint métabolique intense',
        warmup: [
          { movement: 'Rowing', duration_sec: 300 },
          { movement: 'Thruster Practice', reps: 10, equipment: ['barbell'] }
        ],
        metcon: {
          format: 'For Time',
          time_cap_min: 15,
          parts: [
            { movement: 'Thruster', reps: 21, equipment: ['barbell'], load_pct_1rm_bs: 40 },
            { movement: 'Pull-Up', reps: 21 },
            { movement: 'Thruster', reps: 15, equipment: ['barbell'], load_pct_1rm_bs: 40 },
            { movement: 'Pull-Up', reps: 15 },
            { movement: 'Thruster', reps: 9, equipment: ['barbell'], load_pct_1rm_bs: 40 },
            { movement: 'Pull-Up', reps: 9 }
          ]
        },
        cooldown: [
          { movement: 'Stretch', duration_sec: 300 }
        ]
      }),
      estimated_duration: 25,
      intensity: 'very_high',
      difficulty: 'advanced',
      scaling_options: JSON.stringify(['lighter barbell', 'banded pull-ups', 'ring rows']),
      equipment_required: JSON.stringify(['barbell', 'plates', 'pull-up-bar']),
      focus_areas: JSON.stringify(['conditioning', 'strength-endurance']),
      metrics_tracked: JSON.stringify(['time']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'time' }),
      isActive: true,
      isFeatured: true,
      isPublic: true,
      status: 'published',
      is_benchmark: true,
      coach_notes: 'Un des benchmarks les plus iconiques. Gérez votre rythme dès le début.',
      tags: JSON.stringify(['barbell', 'benchmark', 'classic']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Helen',
      slug: 'helen',
      description: '3 rounds: 400m Run, 21 KB Swings (53/35), 12 Pull-Ups',
      workout_type: 'for_time',
      sport_id: crossfitSport?.id || null,
      blocks: JSON.stringify({
        duration_min: 15,
        stimulus: 'Endurance et puissance',
        warmup: [
          { movement: 'Light Jog', duration_sec: 300 },
          { movement: 'KB Swing Practice', reps: 10, equipment: ['kettlebell'] }
        ],
        metcon: {
          format: 'For Time',
          time_cap_min: 20,
          parts: [
            { movement: 'Run', distance_m: 400 },
            { movement: 'Kettlebell Swing', reps: 21, equipment: ['kettlebell'] },
            { movement: 'Pull-Up', reps: 12 },
            { movement: 'Run', distance_m: 400 },
            { movement: 'Kettlebell Swing', reps: 21, equipment: ['kettlebell'] },
            { movement: 'Pull-Up', reps: 12 },
            { movement: 'Run', distance_m: 400 },
            { movement: 'Kettlebell Swing', reps: 21, equipment: ['kettlebell'] },
            { movement: 'Pull-Up', reps: 12 }
          ]
        },
        cooldown: [
          { movement: 'Walk', duration_sec: 300 }
        ]
      }),
      estimated_duration: 25,
      intensity: 'high',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['lighter KB', 'banded pull-ups', 'reduce distance']),
      equipment_required: JSON.stringify(['kettlebell', 'pull-up-bar']),
      focus_areas: JSON.stringify(['endurance', 'running', 'power']),
      metrics_tracked: JSON.stringify(['time']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'time' }),
      isActive: true,
      isFeatured: true,
      isPublic: true,
      status: 'published',
      is_benchmark: true,
      coach_notes: 'Gardez un rythme soutenu sur la course, cassez les KB swings et pull-ups si nécessaire.',
      tags: JSON.stringify(['running', 'kettlebell', 'benchmark']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'DT',
      slug: 'dt',
      description: '5 rounds: 12 Deadlifts, 9 Hang Power Cleans, 6 Push Jerks (155/105)',
      workout_type: 'for_time',
      sport_id: crossfitSport?.id || null,
      blocks: JSON.stringify({
        duration_min: 20,
        stimulus: 'Force et endurance avec barbell',
        warmup: [
          { movement: 'Rowing', duration_sec: 300 },
          { movement: 'Barbell Complex', reps: 5, equipment: ['barbell'] }
        ],
        metcon: {
          format: 'For Time',
          time_cap_min: 20,
          parts: [
            { movement: 'Deadlift', reps: 12, equipment: ['barbell'] },
            { movement: 'Hang Power Clean', reps: 9, equipment: ['barbell'] },
            { movement: 'Push Jerk', reps: 6, equipment: ['barbell'] }
          ]
        },
        cooldown: [
          { movement: 'Stretch', duration_sec: 300 }
        ]
      }),
      estimated_duration: 30,
      intensity: 'very_high',
      difficulty: 'advanced',
      scaling_options: JSON.stringify(['lighter barbell', 'reduce rounds']),
      equipment_required: JSON.stringify(['barbell', 'plates']),
      focus_areas: JSON.stringify(['strength-endurance', 'weightlifting']),
      metrics_tracked: JSON.stringify(['time']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'time' }),
      isActive: true,
      isFeatured: true,
      isPublic: true,
      status: 'published',
      is_benchmark: true,
      coach_notes: 'Workout très exigeant sur les épaules. Prenez le temps de bien respirer.',
      tags: JSON.stringify(['barbell', 'weightlifting', 'benchmark']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Strength & Metcon',
      slug: 'strength-metcon-1',
      description: 'Back Squat 5x5 + Short MetCon',
      workout_type: 'strength',
      sport_id: crossfitSport?.id || null,
      blocks: JSON.stringify({
        duration_min: 45,
        stimulus: 'Force maximale puis conditioning court',
        warmup: [
          { movement: 'Bike Easy', duration_sec: 300 },
          { movement: 'Squat Mobility', duration_sec: 180 }
        ],
        strength: {
          name: 'Back Squat',
          scheme: '5x5 @80%1RM',
          rest_sec: 180,
          equipment: ['barbell', 'rack']
        },
        metcon: {
          format: 'AMRAP',
          duration_min: 10,
          parts: [
            { movement: 'Burpee', reps: 10 },
            { movement: 'Box Jump', reps: 10, equipment: ['box'] },
            { movement: 'Kettlebell Swing', reps: 10, equipment: ['kettlebell'] }
          ]
        },
        cooldown: [
          { movement: 'Stretch', duration_sec: 300 }
        ]
      }),
      estimated_duration: 50,
      intensity: 'high',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['lighter squat', 'step-ups instead of box jumps']),
      equipment_required: JSON.stringify(['barbell', 'rack', 'box', 'kettlebell']),
      focus_areas: JSON.stringify(['strength', 'legs', 'conditioning']),
      metrics_tracked: JSON.stringify(['weight', 'rounds']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'weight_and_rounds' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: false,
      coach_notes: 'Focus sur la technique du squat. Le metcon doit rester rapide et intense.',
      tags: JSON.stringify(['strength', 'legs', 'mixed']),
      created_at: new Date(),
      updated_at: new Date()
    },

    // ============================================================================
    // RUNNING WORKOUTS
    // ============================================================================
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Interval Training 400m',
      slug: 'intervals-400m',
      description: '8x400m with 90s rest',
      workout_type: 'intervals',
      sport_id: runningSport?.id || null,
      blocks: JSON.stringify({
        duration_min: 40,
        stimulus: 'VO2max development',
        warmup: [
          { movement: 'Easy Jog', duration_sec: 600 },
          { movement: 'Dynamic Stretches', duration_sec: 300 }
        ],
        metcon: {
          format: 'Intervals',
          parts: [
            { movement: 'Run', distance_m: 400, target_zone: 'I', r_rest_sec: 90 },
            { movement: 'Run', distance_m: 400, target_zone: 'I', r_rest_sec: 90 },
            { movement: 'Run', distance_m: 400, target_zone: 'I', r_rest_sec: 90 },
            { movement: 'Run', distance_m: 400, target_zone: 'I', r_rest_sec: 90 },
            { movement: 'Run', distance_m: 400, target_zone: 'I', r_rest_sec: 90 },
            { movement: 'Run', distance_m: 400, target_zone: 'I', r_rest_sec: 90 },
            { movement: 'Run', distance_m: 400, target_zone: 'I', r_rest_sec: 90 },
            { movement: 'Run', distance_m: 400, target_zone: 'I', r_rest_sec: 90 }
          ]
        },
        cooldown: [
          { movement: 'Easy Jog', duration_sec: 600 }
        ]
      }),
      estimated_duration: 45,
      intensity: 'very_high',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['reduce to 6 intervals', 'slower pace']),
      equipment_required: JSON.stringify([]),
      focus_areas: JSON.stringify(['speed', 'vo2max']),
      metrics_tracked: JSON.stringify(['pace', 'heart_rate']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'pace' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: false,
      coach_notes: 'Zone I = Intensité (95-100% effort max). Maintenez un rythme constant sur chaque intervalle.',
      tags: JSON.stringify(['intervals', 'speed', 'vo2max']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Tempo Run 5k',
      slug: 'tempo-5k',
      description: '5km at tempo pace (Zone T)',
      workout_type: 'tempo',
      sport_id: runningSport?.id || null,
      blocks: JSON.stringify({
        duration_min: 40,
        stimulus: 'Lactate threshold improvement',
        warmup: [
          { movement: 'Easy Jog', duration_sec: 900 }
        ],
        metcon: {
          format: 'Intervals',
          parts: [
            { movement: 'Run', distance_m: 5000, target_zone: 'T' }
          ]
        },
        cooldown: [
          { movement: 'Easy Jog', duration_sec: 600 }
        ]
      }),
      estimated_duration: 45,
      intensity: 'high',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['reduce to 3km', 'slower pace']),
      equipment_required: JSON.stringify([]),
      focus_areas: JSON.stringify(['endurance', 'tempo']),
      metrics_tracked: JSON.stringify(['pace', 'time']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'time' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: false,
      coach_notes: 'Zone T = Tempo (85-90% effort). Rythme soutenu mais contrôlable.',
      tags: JSON.stringify(['tempo', 'endurance', 'threshold']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Long Run Easy',
      slug: 'long-run-easy',
      description: '90 minutes easy pace',
      workout_type: 'long_run',
      sport_id: runningSport?.id || null,
      blocks: JSON.stringify({
        duration_min: 90,
        stimulus: 'Aerobic base building',
        warmup: [
          { movement: 'Dynamic Stretches', duration_sec: 300 }
        ],
        metcon: {
          format: 'Intervals',
          parts: [
            { movement: 'Run', duration_min: 90, target_zone: 'E' }
          ]
        },
        cooldown: [
          { movement: 'Walk', duration_sec: 300 }
        ]
      }),
      estimated_duration: 100,
      intensity: 'moderate',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['reduce to 60 min', 'walk breaks']),
      equipment_required: JSON.stringify([]),
      focus_areas: JSON.stringify(['endurance', 'aerobic-base']),
      metrics_tracked: JSON.stringify(['distance', 'time']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'distance' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: false,
      coach_notes: 'Zone E = Easy (60-70% effort). Vous devez pouvoir parler confortablement.',
      tags: JSON.stringify(['long-run', 'endurance', 'easy']),
      created_at: new Date(),
      updated_at: new Date()
    },

    // ============================================================================
    // MUSCULATION WORKOUTS
    // ============================================================================
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Push Day - Strength',
      slug: 'push-strength',
      description: 'Bench Press + accessories',
      workout_type: 'strength',
      sport_id: musculationSport?.id || null,
      blocks: JSON.stringify({
        duration_min: 60,
        stimulus: 'Upper body push development',
        warmup: [
          { movement: 'Arm Circles', reps: 20 },
          { movement: 'Band Pull-Aparts', reps: 20, equipment: ['band'] }
        ],
        strength: {
          name: 'Bench Press',
          scheme: '5x5 @80%1RM',
          rest_sec: 180,
          notes: 'Tempo 21X1',
          equipment: ['barbell', 'bench']
        },
        accessory: [
          { movement: 'Incline Dumbbell Press', scheme: '3x10', equipment: ['dumbbell', 'bench'] },
          { movement: 'Cable Fly', scheme: '3x12', equipment: ['cable-machine'] },
          { movement: 'Overhead Press', scheme: '3x8', equipment: ['barbell'] },
          { movement: 'Triceps Pushdown', scheme: '3x15', equipment: ['cable-machine'] }
        ],
        cooldown: [
          { movement: 'Chest Stretch', duration_sec: 90 },
          { movement: 'Shoulder Stretch', duration_sec: 90 }
        ]
      }),
      estimated_duration: 65,
      intensity: 'high',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['lighter weights', 'reduce sets']),
      equipment_required: JSON.stringify(['barbell', 'bench', 'dumbbell', 'cable-machine']),
      focus_areas: JSON.stringify(['strength', 'chest', 'shoulders']),
      metrics_tracked: JSON.stringify(['weight', 'reps']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'weight' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: false,
      coach_notes: 'Focus sur la technique du bench press. Tempo 21X1 = 2s descente, 1s pause, explosion, 1s en haut.',
      tags: JSON.stringify(['strength', 'upper-body', 'push']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Leg Day - Hypertrophy',
      slug: 'legs-hypertrophy',
      description: 'Squat + leg accessories',
      workout_type: 'hypertrophy',
      sport_id: musculationSport?.id || null,
      blocks: JSON.stringify({
        duration_min: 60,
        stimulus: 'Leg muscle growth',
        warmup: [
          { movement: 'Bike Easy', duration_sec: 300 },
          { movement: 'Leg Swings', reps: 20 }
        ],
        strength: {
          name: 'Back Squat',
          scheme: '4x8 @70%1RM',
          rest_sec: 150,
          equipment: ['barbell', 'rack']
        },
        accessory: [
          { movement: 'Romanian Deadlift', scheme: '3x10', equipment: ['barbell'] },
          { movement: 'Leg Press', scheme: '3x12', equipment: ['leg-press'] },
          { movement: 'Leg Curl', scheme: '3x12', equipment: ['leg-curl'] },
          { movement: 'Leg Extension', scheme: '3x15', equipment: ['leg-extension'] },
          { movement: 'Calf Raise', scheme: '4x20', equipment: ['calf-raise-machine'] }
        ],
        cooldown: [
          { movement: 'Quad Stretch', duration_sec: 90 },
          { movement: 'Hamstring Stretch', duration_sec: 90 }
        ]
      }),
      estimated_duration: 65,
      intensity: 'high',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['lighter weights', 'reduce volume']),
      equipment_required: JSON.stringify(['barbell', 'rack', 'leg-press', 'leg-curl', 'leg-extension', 'calf-raise-machine']),
      focus_areas: JSON.stringify(['hypertrophy', 'legs', 'glutes']),
      metrics_tracked: JSON.stringify(['weight', 'reps']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'weight' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: false,
      coach_notes: 'Volume élevé pour l\'hypertrophie. Focus sur la contraction musculaire et le tempo.',
      tags: JSON.stringify(['hypertrophy', 'legs', 'volume']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Pull Day - Back Focus',
      slug: 'pull-back',
      description: 'Deadlift + back accessories',
      workout_type: 'strength',
      sport_id: musculationSport?.id || null,
      blocks: JSON.stringify({
        duration_min: 60,
        stimulus: 'Back and posterior chain development',
        warmup: [
          { movement: 'Rowing Easy', duration_sec: 300 },
          { movement: 'Band Pull-Aparts', reps: 20, equipment: ['band'] }
        ],
        strength: {
          name: 'Deadlift',
          scheme: '5x3 @85%1RM',
          rest_sec: 180,
          equipment: ['barbell', 'plates']
        },
        accessory: [
          { movement: 'Pull-Up', scheme: '4xMax', equipment: ['pull-up-bar'] },
          { movement: 'Barbell Row', scheme: '3x10', equipment: ['barbell'] },
          { movement: 'Lat Pulldown', scheme: '3x12', equipment: ['lat-pulldown'] },
          { movement: 'Face Pulls', scheme: '3x15', equipment: ['cable-machine'] },
          { movement: 'Biceps Curl', scheme: '3x12', equipment: ['dumbbell'] }
        ],
        cooldown: [
          { movement: 'Lat Stretch', duration_sec: 90 },
          { movement: 'Lower Back Stretch', duration_sec: 90 }
        ]
      }),
      estimated_duration: 65,
      intensity: 'high',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['lighter deadlift', 'banded pull-ups']),
      equipment_required: JSON.stringify(['barbell', 'plates', 'pull-up-bar', 'lat-pulldown', 'cable-machine', 'dumbbell']),
      focus_areas: JSON.stringify(['strength', 'back', 'posterior-chain']),
      metrics_tracked: JSON.stringify(['weight', 'reps']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'weight' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: false,
      coach_notes: 'Le deadlift est l\'exercice principal. Gardez le dos droit sur tous les exercices.',
      tags: JSON.stringify(['strength', 'back', 'pull']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Full Body Circuit',
      slug: 'full-body-circuit',
      description: 'Circuit training complet',
      workout_type: 'circuit',
      sport_id: musculationSport?.id || null,
      blocks: JSON.stringify({
        duration_min: 45,
        stimulus: 'Full body conditioning and muscle endurance',
        warmup: [
          { movement: 'Jump Rope', duration_sec: 180 },
          { movement: 'Dynamic Stretches', duration_sec: 180 }
        ],
        metcon: {
          format: 'Intervals',
          parts: [
            { movement: 'Goblet Squat', reps: 12, equipment: ['kettlebell'] },
            { movement: 'Push-Up', reps: 15 },
            { movement: 'Kettlebell Row', reps: 12, equipment: ['kettlebell'] },
            { movement: 'Dumbbell Press', reps: 12, equipment: ['dumbbell'] },
            { movement: 'Plank', duration_min: 1 },
            { movement: 'Burpee', reps: 10 }
          ],
          substitutions: {
            'goblet_squat': ['dumbbell squat', 'bodyweight squat']
          }
        },
        cooldown: [
          { movement: 'Full Body Stretch', duration_sec: 300 }
        ]
      }),
      estimated_duration: 50,
      intensity: 'moderate',
      difficulty: 'beginner',
      scaling_options: JSON.stringify(['lighter weights', 'reduce reps', 'longer rest']),
      equipment_required: JSON.stringify(['kettlebell', 'dumbbell']),
      focus_areas: JSON.stringify(['full-body', 'conditioning', 'endurance']),
      metrics_tracked: JSON.stringify(['rounds', 'time']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'rounds' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: false,
      coach_notes: '3-4 rounds du circuit avec 2 min de repos entre les rounds. Focus qualité > vitesse.',
      tags: JSON.stringify(['circuit', 'full-body', 'beginner-friendly']),
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  await knex('workouts').insert(workouts);
}
