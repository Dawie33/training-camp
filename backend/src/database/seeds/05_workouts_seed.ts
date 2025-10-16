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
        stimulus: 'Endurance musculaire et cardio',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 5,
            exercises: [
              { name: 'Jump Rope', duration: '3 min' },
              { name: 'Shoulder Circles', reps: '10' }
            ]
          },
          {
            type: 'amrap',
            title: 'AMRAP',
            format: 'AMRAP 20 min',
            duration_min: 20,
            goal: 'Maximum de rounds et reps',
            exercises: [
              { name: 'Pull-Up', reps: '5' },
              { name: 'Push-Up', reps: '10' },
              { name: 'Air Squat', reps: '15' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Retour au calme',
            duration_min: 5,
            exercises: [
              { name: 'Walk', duration: '5 min' }
            ]
          }
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
        stimulus: 'Sprint métabolique intense',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 8,
            exercises: [
              { name: 'Rowing', duration: '5 min' },
              { name: 'Thruster Practice', reps: '10', details: 'Avec barre vide ou légère' }
            ]
          },
          {
            type: 'for_time',
            title: 'For Time (21-15-9)',
            format: 'For Time - Cap 15 min',
            duration_min: 15,
            goal: 'Terminer le plus rapidement possible',
            description: '21-15-9 reps de chaque exercice',
            exercises: [
              { name: 'Thruster', reps: '21-15-9', weight: '43kg/30kg', details: 'RX: 95lbs/65lbs' },
              { name: 'Pull-Up', reps: '21-15-9' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Retour au calme',
            duration_min: 5,
            exercises: [
              { name: 'Stretch', duration: '5 min', details: 'Focus épaules et dos' }
            ]
          }
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
        stimulus: 'Endurance et puissance',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 8,
            exercises: [
              { name: 'Light Jog', duration: '5 min' },
              { name: 'KB Swing Practice', reps: '10', details: 'Technique focus' }
            ]
          },
          {
            type: 'for_time',
            title: 'For Time (3 rounds)',
            format: 'For Time - Cap 20 min',
            duration_min: 20,
            rounds: 3,
            goal: 'Terminer les 3 rounds le plus rapidement possible',
            exercises: [
              { name: 'Run', distance: '400m' },
              { name: 'Kettlebell Swing', reps: '21', weight: '24kg/16kg', details: 'RX: 53lbs/35lbs' },
              { name: 'Pull-Up', reps: '12' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Retour au calme',
            duration_min: 5,
            exercises: [
              { name: 'Walk', duration: '5 min' }
            ]
          }
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
        stimulus: 'Force et endurance avec barbell',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 8,
            exercises: [
              { name: 'Rowing', duration: '5 min' },
              { name: 'Barbell Complex', reps: '5', details: 'Barre vide: deadlift + hang clean + jerk' }
            ]
          },
          {
            type: 'for_time',
            title: 'For Time (5 rounds)',
            format: 'For Time - Cap 20 min',
            duration_min: 20,
            rounds: 5,
            goal: 'Terminer les 5 rounds le plus rapidement possible',
            exercises: [
              { name: 'Deadlift', reps: '12', weight: '70kg/48kg', details: 'RX: 155lbs/105lbs' },
              { name: 'Hang Power Clean', reps: '9', weight: '70kg/48kg' },
              { name: 'Push Jerk', reps: '6', weight: '70kg/48kg' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Retour au calme',
            duration_min: 5,
            exercises: [
              { name: 'Stretch', duration: '5 min', details: 'Focus épaules, dos et hanches' }
            ]
          }
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
        stimulus: 'Force maximale puis conditioning court',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 8,
            exercises: [
              { name: 'Bike Easy', duration: '5 min' },
              { name: 'Squat Mobility', duration: '3 min', details: 'Hip openers, ankle mobility' }
            ]
          },
          {
            type: 'strength',
            title: 'Strength - Back Squat',
            format: '5 sets x 5 reps @ 80% 1RM',
            duration_min: 25,
            goal: 'Développer la force maximale',
            rest_between_rounds: 180,
            exercises: [
              { name: 'Back Squat', sets: '5', reps: '5', intensity: '80% 1RM', details: 'Repos 3 min entre les séries' }
            ]
          },
          {
            type: 'amrap',
            title: 'MetCon - AMRAP 10',
            format: 'AMRAP 10 min',
            duration_min: 10,
            goal: 'Maximum de rounds',
            exercises: [
              { name: 'Burpee', reps: '10' },
              { name: 'Box Jump', reps: '10', details: '24"/20"' },
              { name: 'Kettlebell Swing', reps: '10', weight: '24kg/16kg' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Retour au calme',
            duration_min: 5,
            exercises: [
              { name: 'Stretch', duration: '5 min', details: 'Full body stretch' }
            ]
          }
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
        stimulus: 'VO2max development',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 15,
            exercises: [
              { name: 'Easy Jog', duration: '10 min' },
              { name: 'Dynamic Stretches', duration: '5 min' }
            ]
          },
          {
            type: 'intervals',
            title: 'Intervalles 8x400m',
            format: '8 x 400m',
            duration_min: 25,
            rounds: 8,
            goal: 'Développer la VO2max',
            intervals: {
              work: {
                distance: '400m',
                effort: 'Zone I (95-100%)'
              },
              rest: {
                duration: '90s',
                type: 'active'
              }
            },
            exercises: [
              { name: 'Run', distance: '400m', effort: 'Zone I', rest_duration: '90s', details: 'Maintenir un rythme constant sur chaque intervalle' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Retour au calme',
            duration_min: 10,
            exercises: [
              { name: 'Easy Jog', duration: '10 min' }
            ]
          }
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
        stimulus: 'Lactate threshold improvement',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 15,
            exercises: [
              { name: 'Easy Jog', duration: '15 min', effort: 'Zone E' }
            ]
          },
          {
            type: 'tempo',
            title: 'Tempo Run 5km',
            format: 'Tempo Run',
            duration_min: 25,
            goal: 'Améliorer le seuil lactique',
            exercises: [
              { name: 'Run', distance: '5km', effort: 'Zone T (85-90%)', pace: 'Tempo', details: 'Rythme soutenu mais contrôlable' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Retour au calme',
            duration_min: 10,
            exercises: [
              { name: 'Easy Jog', duration: '10 min', effort: 'Zone E' }
            ]
          }
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
        stimulus: 'Aerobic base building',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 5,
            exercises: [
              { name: 'Dynamic Stretches', duration: '5 min' }
            ]
          },
          {
            type: 'cardio',
            title: 'Long Run Easy',
            format: 'Continuous Run',
            duration_min: 90,
            goal: 'Développer l\'endurance aérobie',
            exercises: [
              { name: 'Run', duration: '90 min', effort: 'Zone E (60-70%)', details: 'Vous devez pouvoir parler confortablement' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Retour au calme',
            duration_min: 5,
            exercises: [
              { name: 'Walk', duration: '5 min' }
            ]
          }
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
        stimulus: 'Upper body push development',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 8,
            exercises: [
              { name: 'Arm Circles', reps: '20', details: 'Forward and backward' },
              { name: 'Band Pull-Aparts', reps: '20' }
            ]
          },
          {
            type: 'strength',
            title: 'Strength - Bench Press',
            format: '5 sets x 5 reps @ 80% 1RM',
            duration_min: 25,
            goal: 'Développer la force de poussée',
            rest_between_rounds: 180,
            exercises: [
              { name: 'Bench Press', sets: '5', reps: '5', intensity: '80% 1RM', tempo: '21X1', details: 'Repos 3 min entre séries' }
            ]
          },
          {
            type: 'accessory',
            title: 'Accessoires',
            duration_min: 25,
            goal: 'Volume et hypertrophie',
            exercises: [
              { name: 'Incline Dumbbell Press', sets: '3', reps: '10' },
              { name: 'Cable Fly', sets: '3', reps: '12' },
              { name: 'Overhead Press', sets: '3', reps: '8' },
              { name: 'Triceps Pushdown', sets: '3', reps: '15' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Étirements',
            duration_min: 5,
            exercises: [
              { name: 'Chest Stretch', duration: '90s' },
              { name: 'Shoulder Stretch', duration: '90s' }
            ]
          }
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
        stimulus: 'Leg muscle growth',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 8,
            exercises: [
              { name: 'Bike Easy', duration: '5 min' },
              { name: 'Leg Swings', reps: '20', details: 'Forward/back and side to side' }
            ]
          },
          {
            type: 'strength',
            title: 'Strength - Back Squat',
            format: '4 sets x 8 reps @ 70% 1RM',
            duration_min: 20,
            goal: 'Hypertrophie des jambes',
            rest_between_rounds: 150,
            exercises: [
              { name: 'Back Squat', sets: '4', reps: '8', intensity: '70% 1RM', details: 'Repos 2:30 entre séries' }
            ]
          },
          {
            type: 'accessory',
            title: 'Accessoires',
            duration_min: 35,
            goal: 'Volume et hypertrophie',
            exercises: [
              { name: 'Romanian Deadlift', sets: '3', reps: '10' },
              { name: 'Leg Press', sets: '3', reps: '12' },
              { name: 'Leg Curl', sets: '3', reps: '12' },
              { name: 'Leg Extension', sets: '3', reps: '15' },
              { name: 'Calf Raise', sets: '4', reps: '20' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Étirements',
            duration_min: 5,
            exercises: [
              { name: 'Quad Stretch', duration: '90s' },
              { name: 'Hamstring Stretch', duration: '90s' }
            ]
          }
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
        stimulus: 'Back and posterior chain development',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 8,
            exercises: [
              { name: 'Rowing Easy', duration: '5 min' },
              { name: 'Band Pull-Aparts', reps: '20' }
            ]
          },
          {
            type: 'strength',
            title: 'Strength - Deadlift',
            format: '5 sets x 3 reps @ 85% 1RM',
            duration_min: 25,
            goal: 'Développer la force du dos et de la chaîne postérieure',
            rest_between_rounds: 180,
            exercises: [
              { name: 'Deadlift', sets: '5', reps: '3', intensity: '85% 1RM', details: 'Repos 3 min entre séries' }
            ]
          },
          {
            type: 'accessory',
            title: 'Accessoires',
            duration_min: 30,
            goal: 'Volume dos et bras',
            exercises: [
              { name: 'Pull-Up', sets: '4', reps: 'Max' },
              { name: 'Barbell Row', sets: '3', reps: '10' },
              { name: 'Lat Pulldown', sets: '3', reps: '12' },
              { name: 'Face Pulls', sets: '3', reps: '15' },
              { name: 'Biceps Curl', sets: '3', reps: '12' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Étirements',
            duration_min: 5,
            exercises: [
              { name: 'Lat Stretch', duration: '90s' },
              { name: 'Lower Back Stretch', duration: '90s' }
            ]
          }
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
        stimulus: 'Full body conditioning and muscle endurance',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 6,
            exercises: [
              { name: 'Jump Rope', duration: '3 min' },
              { name: 'Dynamic Stretches', duration: '3 min' }
            ]
          },
          {
            type: 'circuit',
            title: 'Circuit Full Body',
            format: '3-4 rounds - 2 min rest between rounds',
            duration_min: 35,
            rounds: 4,
            rest_between_rounds: 120,
            goal: 'Conditioning et endurance musculaire',
            exercises: [
              { name: 'Goblet Squat', reps: '12', details: 'Ou bodyweight squat si débutant' },
              { name: 'Push-Up', reps: '15' },
              { name: 'Kettlebell Row', reps: '12', per_side: true },
              { name: 'Dumbbell Press', reps: '12' },
              { name: 'Plank', duration: '1 min' },
              { name: 'Burpee', reps: '10' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Étirements',
            duration_min: 5,
            exercises: [
              { name: 'Full Body Stretch', duration: '5 min' }
            ]
          }
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
