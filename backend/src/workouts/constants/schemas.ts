import { z } from 'zod'

export const EQUIPMENT = [
  // Bodyweight & basics
  'bodyweight', 'mat', 'band',

  // Free weights
  'barbell', 'plates', 'rack', 'bench', 'dumbbell', 'kettlebell', 'trap-bar',

  // CrossFit/Functional
  'box', 'pull-up-bar', 'jump-rope', 'rower', 'assault-bike', 'ski-erg', 'sled', 'wall-ball',
  'rings', 'parallettes', 'ghd', 'medicine-ball',

  // Gym machines & cables
  'cable-machine', 'lat-pulldown', 'leg-press', 'leg-curl', 'leg-extension',
  'chest-press-machine', 'shoulder-press-machine', 'pec-deck', 'cable-crossover',
  'seated-row-machine', 'smith-machine', 'hack-squat', 'calf-raise-machine',
  'preacher-curl-bench', 'ez-bar', 'triceps-machine', 'biceps-machine',

  // Cardio machines
  'treadmill', 'stationary-bike', 'elliptical', 'stairmaster',

  // Accessories
  'foam-roller', 'lacrosse-ball', 'ab-wheel', 'suspension-trainer', 'plyo-box'
] as const

// Presets d'équipement pour différents environnements
export const EQUIPMENT_PRESETS = {
  minimal: ['bodyweight', 'mat'],
  home: ['bodyweight', 'mat', 'band', 'dumbbell', 'kettlebell', 'pull-up-bar', 'jump-rope'],
  crossfit: ['bodyweight', 'mat', 'band', 'barbell', 'plates', 'rack', 'bench', 'dumbbell', 'kettlebell',
    'box', 'pull-up-bar', 'jump-rope', 'rower', 'assault-bike', 'ski-erg', 'sled', 'wall-ball',
    'rings', 'parallettes', 'ghd', 'medicine-ball'],
  gym: EQUIPMENT.filter(e => !['rings', 'parallettes', 'ghd', 'ski-erg', 'assault-bike', 'wall-ball'].includes(e)), // Tout sauf équipement CrossFit spécifique
  full: [...EQUIPMENT], // Tout
} as const

export const EquipmentSlug = z.enum(EQUIPMENT)

const withEquipment = {
  equipment: z.array(EquipmentSlug).min(1).optional(),
}

/**
 * Schémas de validation pour les plans d'entraînement.
 * Utilisés pour valider les données générées par l'IA.
 * Basé sur les types dans workouts.types.ts
 */
export const StrengthBlockSchema = z.object({
  name: z.string(),
  scheme: z.string(),
  percent_1rm: z.number().min(0).max(100).optional(),
  rest_sec: z.number().int().positive().optional(),
  notes: z.string().optional(),
  ...withEquipment,
})

/**
 * Zones cibles pour les entraînements (Endurance, Modérée, Tempo, Intensité, Récupération)
 */
const TargetZone = z.enum(['E', 'M', 'T', 'I', 'R'])

/**
 * Partie d'un entraînement métabolique (metcon)
 */
export const MetconPartSchema = z.object({
  movement: z.string(),
  reps: z.number().int().positive().optional(),
  calories: z.number().int().positive().optional(),
  distance_m: z.number().int().positive().optional(),
  duration_min: z.number().positive().optional(),
  load_pct_1rm_bs: z.number().min(0).max(100).optional(),
  target_zone: TargetZone.optional(),
  target_pct_ftp: z.number().min(0.5).max(1.2).optional(),
  r_rest_sec: z.number().int().nonnegative().optional(),
  ...withEquipment,
})

/**
 * Bloc d'entraînement métabolique (metcon)
 */
export const MetconBlockSchema = z.object({
  format: z.enum(['For Time', 'AMRAP', 'EMOM', 'Intervals']),
  time_cap_min: z.number().positive().optional(),
  duration_min: z.number().positive().optional(),
  parts: z.array(MetconPartSchema),
  substitutions: z.record(z.array(z.string())).optional(),
})

/**
 * Structure complète des blocs d'entraînement
 */
export const WorkoutBlocksSchema = z.object({
  duration_min: z.number().positive(),
  stimulus: z.string().optional(),
  warmup: z.array(z.object({
    movement: z.string(),
    duration_sec: z.number().int().positive().optional(),
    reps: z.number().int().positive().optional(),
    ...withEquipment,
  })).optional(),
  strength: StrengthBlockSchema.optional(),
  metcon: MetconBlockSchema.optional(),
  accessory: z.array(z.object({ movement: z.string(), scheme: z.string() })).optional(),
  cooldown: z.array(z.object({
    movement: z.string(),
    duration_sec: z.number().int().positive().optional(),
    reps: z.number().int().positive().optional(),
    ...withEquipment,
  })).optional(),
}).superRefine((v, ctx) => {
  if (v.duration_min > 60) {
    ctx.addIssue({ code: 'custom', path: ['duration_min'], message: '≤ 60 min' })
  }
})

/**
 * Plan d'entraînement journalier complet
 */
export const DailyPlanSchema = z.object({
  date: z.string(),        // tu peux affiner avec regex ISO
  sportId: z.string(),
  name: z.string(),        // Nom du workout généré par l'IA
  workout_type: z.string(), // Type: amrap, for_time, intervals, strength, etc.
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']), // Difficulté
  intensity: z.enum(['low', 'moderate', 'high', 'very_high']), // Intensité
  tags: z.array(z.string()),
  blocks: WorkoutBlocksSchema,
  description: z.string(),  // Description du workout
  coach_notes: z.string(),  // Conseils du coach pour bien réaliser le workout

})

export type DailyPlan = z.infer<typeof DailyPlanSchema>

