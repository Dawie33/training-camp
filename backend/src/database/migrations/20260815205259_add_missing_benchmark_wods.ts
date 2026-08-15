import type { Knex } from "knex"

const SLUGS = ['murph', 'annie', 'diane', 'elizabeth', 'isabel', 'kelly']

export async function up(knex: Knex): Promise<void> {
  await knex('workouts').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Murph',
      slug: 'murph',
      description: '1 mile Run, 100 Pull-Ups, 200 Push-Ups, 300 Air Squats, 1 mile Run (avec gilet lesté 9/6kg)',
      workout_type: 'for_time',
      blocks: JSON.stringify({
        stimulus: 'Endurance et volume musculaire extrême',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 10,
            exercises: [
              { name: 'Light Jog', duration: '5 min' },
              { name: 'Dynamic Stretching', duration: '5 min' }
            ]
          },
          {
            type: 'for_time',
            title: 'For Time',
            format: 'For Time',
            duration_min: 60,
            goal: 'Terminer le plus rapidement possible (partition libre des reps autorisée)',
            exercises: [
              { name: 'Run', distance: '1 mile' },
              { name: 'Pull-Up', reps: '100' },
              { name: 'Push-Up', reps: '200' },
              { name: 'Air Squat', reps: '300' },
              { name: 'Run', distance: '1 mile' }
            ],
            details: 'RX avec gilet lesté 9kg/6kg'
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
      estimated_duration: 60,
      intensity: 'very_high',
      difficulty: 'advanced',
      scaling_options: JSON.stringify(['sans gilet lesté', 'diviser en half Murph', 'bandes pour pull-ups']),
      equipment_required: JSON.stringify(['pull-up-bar', 'weight-vest']),
      focus_areas: JSON.stringify(['endurance', 'gymnastics', 'mental-toughness']),
      metrics_tracked: JSON.stringify(['time']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'time' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: true,
      coach_notes: "Hero WOD en hommage au Lt. Michael Murphy. Partitionnez les reps (ex: 20 rounds de 5 pull-ups/10 push-ups/15 squats) pour gérer l'effort.",
      tags: JSON.stringify(['hero-wod', 'benchmark', 'bodyweight']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Annie',
      slug: 'annie',
      description: '50-40-30-20-10 reps: Double-Unders et Sit-Ups',
      workout_type: 'for_time',
      blocks: JSON.stringify({
        stimulus: 'Cardio et gainage à haute cadence',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 6,
            exercises: [
              { name: 'Single-Under', reps: '50' },
              { name: 'Sit-Up Practice', reps: '10' }
            ]
          },
          {
            type: 'for_time',
            title: 'For Time (50-40-30-20-10)',
            format: 'For Time',
            duration_min: 15,
            goal: 'Terminer le plus rapidement possible',
            exercises: [
              { name: 'Double-Under', reps: '50-40-30-20-10' },
              { name: 'Sit-Up', reps: '50-40-30-20-10' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Retour au calme',
            duration_min: 5,
            exercises: [
              { name: 'Stretch', duration: '5 min', details: 'Focus mollets et abdos' }
            ]
          }
        ]
      }),
      estimated_duration: 20,
      intensity: 'high',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['single-unders à la place des double-unders']),
      equipment_required: JSON.stringify(['jump-rope']),
      focus_areas: JSON.stringify(['cardio', 'core']),
      metrics_tracked: JSON.stringify(['time']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'time' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: true,
      coach_notes: 'La compétence limitante est souvent les double-unders : travaillez la régularité plutôt que la vitesse brute.',
      tags: JSON.stringify(['bodyweight', 'benchmark', 'classic']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Diane',
      slug: 'diane',
      description: '21-15-9 Deadlifts (102/70kg) et Handstand Push-Ups',
      workout_type: 'for_time',
      blocks: JSON.stringify({
        stimulus: 'Force et gymnastique inversée',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 8,
            exercises: [
              { name: 'Rowing', duration: '5 min' },
              { name: 'Deadlift Practice', reps: '10', details: 'Charge légère' },
              { name: 'Wall Walk', reps: '3' }
            ]
          },
          {
            type: 'for_time',
            title: 'For Time (21-15-9)',
            format: 'For Time',
            duration_min: 12,
            goal: 'Terminer le plus rapidement possible',
            exercises: [
              { name: 'Deadlift', reps: '21-15-9', weight: '102kg/70kg', details: 'RX: 225lbs/155lbs' },
              { name: 'Handstand Push-Up', reps: '21-15-9' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Retour au calme',
            duration_min: 5,
            exercises: [
              { name: 'Stretch', duration: '5 min', details: 'Focus dos et épaules' }
            ]
          }
        ]
      }),
      estimated_duration: 20,
      intensity: 'very_high',
      difficulty: 'advanced',
      scaling_options: JSON.stringify(['deadlift plus léger', 'HSPU sur box ou pike push-ups']),
      equipment_required: JSON.stringify(['barbell', 'plates']),
      focus_areas: JSON.stringify(['strength', 'gymnastics']),
      metrics_tracked: JSON.stringify(['time']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'time' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: true,
      coach_notes: "Cassez les handstand push-ups tôt si besoin pour éviter l'échec musculaire en fin de série.",
      tags: JSON.stringify(['barbell', 'benchmark', 'classic']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Elizabeth',
      slug: 'elizabeth',
      description: '21-15-9 Cleans (61/43kg) et Ring Dips',
      workout_type: 'for_time',
      blocks: JSON.stringify({
        stimulus: 'Force explosive et poussée aux anneaux',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 8,
            exercises: [
              { name: 'Rowing', duration: '5 min' },
              { name: 'Clean Practice', reps: '10', details: 'Barre vide' },
              { name: 'Ring Support Hold', duration: '30 sec' }
            ]
          },
          {
            type: 'for_time',
            title: 'For Time (21-15-9)',
            format: 'For Time',
            duration_min: 12,
            goal: 'Terminer le plus rapidement possible',
            exercises: [
              { name: 'Clean', reps: '21-15-9', weight: '61kg/43kg', details: 'RX: 135lbs/95lbs' },
              { name: 'Ring Dip', reps: '21-15-9' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Retour au calme',
            duration_min: 5,
            exercises: [
              { name: 'Stretch', duration: '5 min', details: 'Focus épaules et poitrine' }
            ]
          }
        ]
      }),
      estimated_duration: 20,
      intensity: 'very_high',
      difficulty: 'advanced',
      scaling_options: JSON.stringify(['clean plus léger', 'dips sur box ou bandes']),
      equipment_required: JSON.stringify(['barbell', 'plates', 'rings']),
      focus_areas: JSON.stringify(['strength', 'gymnastics']),
      metrics_tracked: JSON.stringify(['time']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'time' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: true,
      coach_notes: "Technique de clean propre indispensable pour économiser de l'énergie sur les 45 reps.",
      tags: JSON.stringify(['barbell', 'benchmark', 'classic']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Isabel',
      slug: 'isabel',
      description: '30 Snatches (61/43kg)',
      workout_type: 'for_time',
      blocks: JSON.stringify({
        stimulus: 'Puissance et technique olympique',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 8,
            exercises: [
              { name: 'Rowing', duration: '5 min' },
              { name: 'Snatch Practice', reps: '10', details: 'Barre vide, focus technique' }
            ]
          },
          {
            type: 'for_time',
            title: 'For Time',
            format: 'For Time - Cap 8 min',
            duration_min: 8,
            goal: 'Terminer le plus rapidement possible',
            exercises: [
              { name: 'Snatch', reps: '30', weight: '61kg/43kg', details: 'RX: 135lbs/95lbs' }
            ]
          },
          {
            type: 'cooldown',
            title: 'Retour au calme',
            duration_min: 5,
            exercises: [
              { name: 'Stretch', duration: '5 min', details: 'Focus épaules et hanches' }
            ]
          }
        ]
      }),
      estimated_duration: 15,
      intensity: 'very_high',
      difficulty: 'elite',
      scaling_options: JSON.stringify(['charge plus légère', 'power snatch autorisé']),
      equipment_required: JSON.stringify(['barbell', 'plates']),
      focus_areas: JSON.stringify(['weightlifting', 'power']),
      metrics_tracked: JSON.stringify(['time']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'time' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: true,
      coach_notes: 'Un des benchmarks les plus techniques. Ne visez la charge RX que si votre technique de snatch est fiable.',
      tags: JSON.stringify(['barbell', 'weightlifting', 'benchmark']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Kelly',
      slug: 'kelly',
      description: '5 rounds: 400m Run, 30 Box Jumps (61/51cm), 30 Wall Balls (9/6kg)',
      workout_type: 'for_time',
      blocks: JSON.stringify({
        stimulus: 'Endurance longue durée',
        sections: [
          {
            type: 'warmup',
            title: 'Échauffement',
            duration_min: 8,
            exercises: [
              { name: 'Light Jog', duration: '5 min' },
              { name: 'Box Jump Practice', reps: '10' }
            ]
          },
          {
            type: 'for_time',
            title: 'For Time (5 rounds)',
            format: 'For Time - Cap 40 min',
            duration_min: 40,
            rounds: 5,
            goal: 'Terminer les 5 rounds le plus rapidement possible',
            exercises: [
              { name: 'Run', distance: '400m' },
              { name: 'Box Jump', reps: '30', details: 'RX: 24in/20in' },
              { name: 'Wall Ball', reps: '30', weight: '9kg/6kg', details: 'RX: 20lbs/14lbs' }
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
      estimated_duration: 45,
      intensity: 'high',
      difficulty: 'intermediate',
      scaling_options: JSON.stringify(['box jump plus bas ou step-up', 'wall ball plus léger', 'réduire la distance de course']),
      equipment_required: JSON.stringify(['wall-ball', 'plyo-box']),
      focus_areas: JSON.stringify(['endurance', 'conditioning']),
      metrics_tracked: JSON.stringify(['time']),
      ai_generated: false,
      created_by_user_id: null,
      target_metrics: JSON.stringify({ scoring_type: 'time' }),
      isActive: true,
      isFeatured: false,
      isPublic: true,
      status: 'published',
      is_benchmark: true,
      coach_notes: 'WOD long : gérez votre rythme de course dès le premier round pour ne pas vous cramer sur les box jumps.',
      tags: JSON.stringify(['benchmark', 'classic', 'endurance']),
      created_at: new Date(),
      updated_at: new Date()
    }
  ])
}

export async function down(knex: Knex): Promise<void> {
  await knex('workouts').whereIn('slug', SLUGS).del()
}
