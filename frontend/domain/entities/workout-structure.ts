/**
 * Types pour la structure modulaire des workouts
 * Permet de créer des workouts avec des sections flexibles
 */

export type SectionType =
  | 'warmup'
  | 'skill_work'
  | 'strength'
  | 'accessory'
  | 'cardio'
  | 'intervals'
  | 'metcon'
  | 'amrap'
  | 'emom'
  | 'for_time'
  | 'circuit'
  | 'finisher'
  | 'core'
  | 'mobility'
  | 'cooldown'
  | 'tabata'

export const SECTION_TYPE_COLORS: Record<SectionType, string> = {
  warmup: 'border-l-green-500',
  skill_work: 'border-l-cyan-500',
  strength: 'border-l-blue-500',
  accessory: 'border-l-purple-500',
  cardio: 'border-l-red-500',
  intervals: 'border-l-red-500',
  metcon: 'border-l-primary',
  amrap: 'border-l-primary',
  emom: 'border-l-yellow-500',
  for_time: 'border-l-primary',
  circuit: 'border-l-orange-500',
  finisher: 'border-l-primary',
  core: 'border-l-emerald-500',
  mobility: 'border-l-slate-400',
  cooldown: 'border-l-slate-400',
  tabata: 'border-l-yellow-500',
}

export interface Exercise {
  name: string
  // Reps/Sets
  reps?: number | string
  sets?: number
  // Durée
  duration?: string
  work_duration?: string
  rest_duration?: string
  // Distance
  distance?: string
  // Poids
  weight?: string
  // Intensité
  intensity?: string
  pace?: string
  effort?: string
  // Détails additionnels
  details?: string
  tempo?: string
  per_side?: boolean
  // Metrics spécifiques
  cadence?: string
  power?: string
  heart_rate?: string
}

export interface WorkoutSection {
  type: SectionType
  title: string
  duration_min?: number
  duration_max?: number
  description?: string

  // Format du bloc (AMRAP, EMOM, For Time, etc.)
  format?: string

  // Structure répétitive
  rounds?: number
  rest_between_rounds?: number
  between_rounds_task?: string

  // Exercices
  exercises?: Exercise[]

  // Pour les intervalles
  intervals?: {
    work: {
      distance?: string
      duration?: string
      pace?: string
      effort?: string
    }
    rest: {
      duration?: string
      type?: 'active' | 'passive'
    }
  }

  // Objectif de la section
  goal?: string
  focus?: string

  // Sections imbriquées (pour cooldown avec plusieurs parties)
  sections?: WorkoutSection[]
}

export interface WorkoutBlocks {
  sections: WorkoutSection[]
  stimulus?: string
  duration_min?: number
  duration_max?: number
  estimated_calories?: string
}

/**
 * Types de workouts disponibles 
 */
export const WORKOUT_TYPES = {
  crossfit: [
    { value: 'technique_metcon', label: 'MetCon' },
    { value: 'strength_max', label: 'Force Max (RM)' },
    { value: 'conditioning', label: 'Conditioning' },
    { value: 'vo2max', label: 'VO2max (intervalles cardio)' },
    { value: 'benchmark', label: 'Benchmark (Fran, Murph, etc.)' },
  ]
} as const

/**
 * Tags prédéfinis pour faciliter la catégorisation
 */
export const SUGGESTED_TAGS = [
  // Type d'effort
  'cardio',
  'strength',
  'power',
  'endurance',
  'speed',
  'technique',

  // Caractéristiques
  'no-impact',
  'low-impact',
  'bodyweight',
  'weighted',
  'benchmark',

  // Équipement
  'equipment:barbell',
  'equipment:dumbbells',
  'equipment:kettlebell',
  'equipment:rower',
  'equipment:bike',
  'equipment:skierg',
  'equipment:pullup-bar',
  'no-equipment',

  // Focus corporel
  'upper-body',
  'lower-body',
  'full-body',
  'core',
  'posterior-chain',

  // Durée
  'short',      // < 30 min
  'medium',     // 30-60 min
  'long',       // > 60 min

  // Accessibilité
  'beginner-friendly',
  'scalable',
  'rx-only',

  // Modalités CrossFit
  'gymnastic',
  'weightlifting',
  'monostructural',
  'mixed-modal',

  // Style
  'chipper',
  'amrap',
  'emom',
  'intervals',
  'ladder',
] as const
