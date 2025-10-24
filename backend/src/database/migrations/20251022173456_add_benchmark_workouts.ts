import type { Knex } from "knex";

interface WorkoutInsert {
  name: string;
  slug: string;
  description: string;
  workout_type: string;
  sport_id: string;
  blocks: string;
  estimated_duration: number;
  intensity: string;
  difficulty: string;
  scaling_options: string;
  equipment_required: string;
  focus_areas: string;
  metrics_tracked: string;
  ai_generated: boolean;
  created_by_user_id: null;
  target_metrics: string;
  isActive: boolean;
  isFeatured: boolean;
  isPublic: boolean;
  status: string;
  is_benchmark: boolean;
  coach_notes: string;
  tags: string;
  created_at: Date;
  updated_at: Date;
}

export async function up(knex: Knex): Promise<void> {
  // Récupérer les IDs des sports
  const runningSport = await knex('sports').where({ slug: 'running' }).first();
  const cyclingSport = await knex('sports').where({ slug: 'cycling' }).first();
  const musculationSport = await knex('sports').where({ slug: 'musculation' }).first();

  const benchmarkWorkouts: WorkoutInsert[] = [];

  // ============================================================================
  // RUNNING BENCHMARKS
  // ============================================================================
  if (runningSport) {
    benchmarkWorkouts.push(
      // 5K Time Trial
      {
        name: '5K Time Trial',
        slug: '5k-time-trial',
        description: 'Courir 5 kilomètres le plus rapidement possible',
        workout_type: 'for_time',
        sport_id: runningSport.id,
        blocks: JSON.stringify({
          stimulus: 'Test d\'endurance et de vitesse',
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
              type: 'for_time',
              title: '5K Time Trial',
              format: 'For Time',
              duration_min: 30,
              goal: 'Terminer les 5km le plus rapidement possible',
              description: 'Courir 5000m à allure maximale soutenable',
              exercises: [
                { name: 'Run', distance: '5000m', effort: 'Maximum' }
              ]
            },
            {
              type: 'cooldown',
              title: 'Retour au calme',
              duration_min: 10,
              exercises: [
                { name: 'Easy Walk/Jog', duration: '10 min' }
              ]
            }
          ]
        }),
        estimated_duration: 55,
        intensity: 'very_high',
        difficulty: 'intermediate',
        scaling_options: JSON.stringify(['reduce to 3K', 'reduce pace']),
        equipment_required: JSON.stringify([]),
        focus_areas: JSON.stringify(['endurance', 'speed']),
        metrics_tracked: JSON.stringify(['time', 'pace']),
        ai_generated: false,
        created_by_user_id: null,
        target_metrics: JSON.stringify({ scoring_type: 'time', distance: 5000 }),
        isActive: true,
        isFeatured: true,
        isPublic: true,
        status: 'published',
        is_benchmark: true,
        coach_notes: 'Benchmark classique de running. Visez un rythme constant sur toute la distance.',
        tags: JSON.stringify(['benchmark', 'endurance', '5k']),
        created_at: new Date(),
        updated_at: new Date()
      },
      // Cooper Test
      {
        name: 'Cooper Test',
        slug: 'cooper-test',
        description: 'Courir la plus grande distance possible en 12 minutes',
        workout_type: 'amrap',
        sport_id: runningSport.id,
        blocks: JSON.stringify({
          stimulus: 'Test de VO2max',
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
              type: 'amrap',
              title: 'Cooper Test - 12 minutes',
              format: 'AMRAP 12 min',
              duration_min: 12,
              goal: 'Parcourir la plus grande distance possible',
              description: 'Courir le plus loin possible en 12 minutes',
              exercises: [
                { name: 'Run', duration: '12 min', effort: 'Maximum soutenable' }
              ]
            },
            {
              type: 'cooldown',
              title: 'Retour au calme',
              duration_min: 10,
              exercises: [
                { name: 'Easy Walk/Jog', duration: '10 min' }
              ]
            }
          ]
        }),
        estimated_duration: 37,
        intensity: 'very_high',
        difficulty: 'intermediate',
        scaling_options: JSON.stringify(['reduce to 6 minutes', 'reduce pace']),
        equipment_required: JSON.stringify([]),
        focus_areas: JSON.stringify(['vo2max', 'endurance']),
        metrics_tracked: JSON.stringify(['distance']),
        ai_generated: false,
        created_by_user_id: null,
        target_metrics: JSON.stringify({ scoring_type: 'distance', duration: 720 }),
        isActive: true,
        isFeatured: true,
        isPublic: true,
        status: 'published',
        is_benchmark: true,
        coach_notes: 'Test classique de VO2max. Démarrez à un rythme soutenable et maintenez-le.',
        tags: JSON.stringify(['benchmark', 'cooper', 'vo2max']),
        created_at: new Date(),
        updated_at: new Date()
      },
      // 1 Mile Time Trial
      {
        name: '1 Mile Time Trial',
        slug: '1-mile-time-trial',
        description: 'Courir 1 mile (1609m) le plus rapidement possible',
        workout_type: 'for_time',
        sport_id: runningSport.id,
        blocks: JSON.stringify({
          stimulus: 'Test de vitesse et d\'endurance',
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
              type: 'for_time',
              title: '1 Mile Time Trial',
              format: 'For Time',
              duration_min: 10,
              goal: 'Terminer 1 mile le plus rapidement possible',
              description: 'Courir 1609m à allure maximale',
              exercises: [
                { name: 'Run', distance: '1609m', effort: 'Maximum' }
              ]
            },
            {
              type: 'cooldown',
              title: 'Retour au calme',
              duration_min: 10,
              exercises: [
                { name: 'Easy Walk/Jog', duration: '10 min' }
              ]
            }
          ]
        }),
        estimated_duration: 35,
        intensity: 'very_high',
        difficulty: 'beginner',
        scaling_options: JSON.stringify(['reduce to 800m', 'reduce pace']),
        equipment_required: JSON.stringify([]),
        focus_areas: JSON.stringify(['speed', 'endurance']),
        metrics_tracked: JSON.stringify(['time', 'pace']),
        ai_generated: false,
        created_by_user_id: null,
        target_metrics: JSON.stringify({ scoring_type: 'time', distance: 1609 }),
        isActive: true,
        isFeatured: true,
        isPublic: true,
        status: 'published',
        is_benchmark: true,
        coach_notes: 'Benchmark de distance intermédiaire. Bon indicateur de vitesse sur moyenne distance.',
        tags: JSON.stringify(['benchmark', 'mile', 'speed']),
        created_at: new Date(),
        updated_at: new Date()
      }
    );
  }

  // ============================================================================
  // CYCLING BENCHMARKS
  // ============================================================================
  if (cyclingSport) {
    benchmarkWorkouts.push(
      // FTP Test 20min
      {
        name: 'FTP Test (20 min)',
        slug: 'ftp-test-20min',
        description: 'Test de puissance au seuil fonctionnel - 20 minutes à effort maximal',
        workout_type: 'for_time',
        sport_id: cyclingSport.id,
        blocks: JSON.stringify({
          stimulus: 'Test de puissance au seuil (FTP)',
          sections: [
            {
              type: 'warmup',
              title: 'Échauffement',
              duration_min: 20,
              exercises: [
                { name: 'Easy Spin', duration: '15 min', details: 'Zone 2 - 60-70% FTP' },
                { name: '3x1min efforts', duration: '5 min', details: 'Montées progressives avec récup' }
              ]
            },
            {
              type: 'for_time',
              title: 'FTP Test 20 minutes',
              format: 'For Time',
              duration_min: 20,
              goal: 'Maintenir la puissance maximale possible pendant 20 minutes',
              description: 'Pédaler à l\'effort maximal soutenable pendant 20 minutes',
              exercises: [
                { name: 'Bike', duration: '20 min', effort: '95-100% de votre maximum' }
              ]
            },
            {
              type: 'cooldown',
              title: 'Retour au calme',
              duration_min: 10,
              exercises: [
                { name: 'Easy Spin', duration: '10 min' }
              ]
            }
          ]
        }),
        estimated_duration: 50,
        intensity: 'very_high',
        difficulty: 'intermediate',
        scaling_options: JSON.stringify(['reduce to 10 minutes', 'lower effort']),
        equipment_required: JSON.stringify(['bike', 'power-meter']),
        focus_areas: JSON.stringify(['ftp', 'threshold', 'power']),
        metrics_tracked: JSON.stringify(['power', 'heart_rate']),
        ai_generated: false,
        created_by_user_id: null,
        target_metrics: JSON.stringify({ scoring_type: 'power', duration: 1200 }),
        isActive: true,
        isFeatured: true,
        isPublic: true,
        status: 'published',
        is_benchmark: true,
        coach_notes: 'FTP = 95% de la puissance moyenne sur 20 min. Standard pour le cyclisme.',
        tags: JSON.stringify(['benchmark', 'ftp', 'power', 'threshold']),
        created_at: new Date(),
        updated_at: new Date()
      },
      // 5K Cycling Time Trial
      {
        name: '5K Cycling Time Trial',
        slug: '5k-cycling-time-trial',
        description: 'Parcourir 5 kilomètres le plus rapidement possible en vélo',
        workout_type: 'for_time',
        sport_id: cyclingSport.id,
        blocks: JSON.stringify({
          stimulus: 'Test de vitesse et puissance',
          sections: [
            {
              type: 'warmup',
              title: 'Échauffement',
              duration_min: 15,
              exercises: [
                { name: 'Easy Spin', duration: '15 min' }
              ]
            },
            {
              type: 'for_time',
              title: '5K Cycling TT',
              format: 'For Time',
              duration_min: 15,
              goal: 'Parcourir 5km le plus vite possible',
              description: 'Contre-la-montre de 5000m',
              exercises: [
                { name: 'Bike', distance: '5000m', effort: 'Maximum' }
              ]
            },
            {
              type: 'cooldown',
              title: 'Retour au calme',
              duration_min: 10,
              exercises: [
                { name: 'Easy Spin', duration: '10 min' }
              ]
            }
          ]
        }),
        estimated_duration: 40,
        intensity: 'very_high',
        difficulty: 'beginner',
        scaling_options: JSON.stringify(['reduce to 3K', 'lower effort']),
        equipment_required: JSON.stringify(['bike']),
        focus_areas: JSON.stringify(['speed', 'power']),
        metrics_tracked: JSON.stringify(['time', 'speed', 'power']),
        ai_generated: false,
        created_by_user_id: null,
        target_metrics: JSON.stringify({ scoring_type: 'time', distance: 5000 }),
        isActive: true,
        isFeatured: true,
        isPublic: true,
        status: 'published',
        is_benchmark: true,
        coach_notes: 'Test court mais intense. Bon indicateur de puissance anaérobie.',
        tags: JSON.stringify(['benchmark', 'time-trial', '5k']),
        created_at: new Date(),
        updated_at: new Date()
      }
    );
  }

  // ============================================================================
  // MUSCULATION BENCHMARKS
  // ============================================================================
  if (musculationSport) {
    benchmarkWorkouts.push(
      // 1RM Bench Press
      {
        name: '1RM Bench Press',
        slug: '1rm-bench-press',
        description: 'Test de force maximale au développé couché',
        workout_type: 'strength',
        sport_id: musculationSport.id,
        blocks: JSON.stringify({
          stimulus: 'Test de force maximale pectoraux',
          sections: [
            {
              type: 'warmup',
              title: 'Échauffement',
              duration_min: 15,
              exercises: [
                { name: 'Light Cardio', duration: '5 min' },
                { name: 'Shoulder Mobility', duration: '5 min' },
                { name: 'Bench Press Warmup Sets', duration: '5 min', details: 'Séries progressives' }
              ]
            },
            {
              type: 'strength',
              title: 'Test 1RM Bench Press',
              format: '1RM',
              duration_min: 25,
              goal: 'Déterminer votre charge maximale pour 1 répétition',
              description: 'Montées progressives jusqu\'au 1RM',
              exercises: [
                { name: 'Bench Press', reps: '1', details: 'Montée progressive : 50% x 10, 70% x 5, 85% x 3, 95% x 1, 100%+ x 1' }
              ]
            },
            {
              type: 'cooldown',
              title: 'Retour au calme',
              duration_min: 10,
              exercises: [
                { name: 'Chest Stretch', duration: '5 min' },
                { name: 'Shoulder Stretch', duration: '5 min' }
              ]
            }
          ]
        }),
        estimated_duration: 50,
        intensity: 'very_high',
        difficulty: 'intermediate',
        scaling_options: JSON.stringify(['use spotter', '3RM instead of 1RM']),
        equipment_required: JSON.stringify(['barbell', 'bench', 'plates']),
        focus_areas: JSON.stringify(['strength', 'chest', 'max-effort']),
        metrics_tracked: JSON.stringify(['weight']),
        ai_generated: false,
        created_by_user_id: null,
        target_metrics: JSON.stringify({ scoring_type: 'weight', exercise: 'bench-press' }),
        isActive: true,
        isFeatured: true,
        isPublic: true,
        status: 'published',
        is_benchmark: true,
        coach_notes: 'Standard universel de force du haut du corps. Prenez toujours un pareur.',
        tags: JSON.stringify(['benchmark', '1rm', 'bench-press', 'strength']),
        created_at: new Date(),
        updated_at: new Date()
      },
      // 1RM Squat
      {
        name: '1RM Back Squat',
        slug: '1rm-back-squat',
        description: 'Test de force maximale au squat',
        workout_type: 'strength',
        sport_id: musculationSport.id,
        blocks: JSON.stringify({
          stimulus: 'Test de force maximale jambes',
          sections: [
            {
              type: 'warmup',
              title: 'Échauffement',
              duration_min: 15,
              exercises: [
                { name: 'Light Cardio', duration: '5 min' },
                { name: 'Hip & Ankle Mobility', duration: '5 min' },
                { name: 'Squat Warmup Sets', duration: '5 min', details: 'Séries progressives' }
              ]
            },
            {
              type: 'strength',
              title: 'Test 1RM Back Squat',
              format: '1RM',
              duration_min: 25,
              goal: 'Déterminer votre charge maximale pour 1 répétition',
              description: 'Montées progressives jusqu\'au 1RM',
              exercises: [
                { name: 'Back Squat', reps: '1', details: 'Montée progressive : 50% x 10, 70% x 5, 85% x 3, 95% x 1, 100%+ x 1' }
              ]
            },
            {
              type: 'cooldown',
              title: 'Retour au calme',
              duration_min: 10,
              exercises: [
                { name: 'Quad Stretch', duration: '5 min' },
                { name: 'Hip Flexor Stretch', duration: '5 min' }
              ]
            }
          ]
        }),
        estimated_duration: 50,
        intensity: 'very_high',
        difficulty: 'advanced',
        scaling_options: JSON.stringify(['use safety bars', '3RM instead of 1RM', 'front squat instead']),
        equipment_required: JSON.stringify(['barbell', 'squat-rack', 'plates']),
        focus_areas: JSON.stringify(['strength', 'legs', 'max-effort']),
        metrics_tracked: JSON.stringify(['weight']),
        ai_generated: false,
        created_by_user_id: null,
        target_metrics: JSON.stringify({ scoring_type: 'weight', exercise: 'squat' }),
        isActive: true,
        isFeatured: true,
        isPublic: true,
        status: 'published',
        is_benchmark: true,
        coach_notes: 'Roi des exercices de force. Assurez-vous d\'avoir une bonne technique.',
        tags: JSON.stringify(['benchmark', '1rm', 'squat', 'strength']),
        created_at: new Date(),
        updated_at: new Date()
      },
      // 1RM Deadlift
      {
        name: '1RM Deadlift',
        slug: '1rm-deadlift',
        description: 'Test de force maximale au soulevé de terre',
        workout_type: 'strength',
        sport_id: musculationSport.id,
        blocks: JSON.stringify({
          stimulus: 'Test de force maximale chaîne postérieure',
          sections: [
            {
              type: 'warmup',
              title: 'Échauffement',
              duration_min: 15,
              exercises: [
                { name: 'Light Cardio', duration: '5 min' },
                { name: 'Hip Hinge Practice', duration: '5 min' },
                { name: 'Deadlift Warmup Sets', duration: '5 min', details: 'Séries progressives' }
              ]
            },
            {
              type: 'strength',
              title: 'Test 1RM Deadlift',
              format: '1RM',
              duration_min: 25,
              goal: 'Déterminer votre charge maximale pour 1 répétition',
              description: 'Montées progressives jusqu\'au 1RM',
              exercises: [
                { name: 'Deadlift', reps: '1', details: 'Montée progressive : 50% x 10, 70% x 5, 85% x 3, 95% x 1, 100%+ x 1' }
              ]
            },
            {
              type: 'cooldown',
              title: 'Retour au calme',
              duration_min: 10,
              exercises: [
                { name: 'Hamstring Stretch', duration: '5 min' },
                { name: 'Lower Back Stretch', duration: '5 min' }
              ]
            }
          ]
        }),
        estimated_duration: 50,
        intensity: 'very_high',
        difficulty: 'advanced',
        scaling_options: JSON.stringify(['trap bar deadlift', '3RM instead of 1RM', 'sumo stance']),
        equipment_required: JSON.stringify(['barbell', 'plates']),
        focus_areas: JSON.stringify(['strength', 'posterior-chain', 'max-effort']),
        metrics_tracked: JSON.stringify(['weight']),
        ai_generated: false,
        created_by_user_id: null,
        target_metrics: JSON.stringify({ scoring_type: 'weight', exercise: 'deadlift' }),
        isActive: true,
        isFeatured: true,
        isPublic: true,
        status: 'published',
        is_benchmark: true,
        coach_notes: 'Test ultime de force totale. Gardez le dos neutre et utilisez les jambes.',
        tags: JSON.stringify(['benchmark', '1rm', 'deadlift', 'strength']),
        created_at: new Date(),
        updated_at: new Date()
      }
    );
  }

  // Insérer tous les benchmarks
  if (benchmarkWorkouts.length > 0) {
    await knex('workouts').insert(benchmarkWorkouts);
  }
}

export async function down(knex: Knex): Promise<void> {
  // Supprimer les benchmarks ajoutés par cette migration
  await knex('workouts')
    .where('is_benchmark', true)
    .whereIn('slug', [
      // Running
      '5k-time-trial',
      'cooper-test',
      '1-mile-time-trial',
      // Cycling
      'ftp-test-20min',
      '5k-cycling-time-trial',
      // Musculation
      '1rm-bench-press',
      '1rm-back-squat',
      '1rm-deadlift'
    ])
    .delete();
}
