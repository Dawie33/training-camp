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
  description?: string

  // Format du bloc (AMRAP, EMOM, For Time, etc.)
  format?: string

  // Structure répétitive
  rounds?: number
  rest_between_rounds?: number

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
  estimated_calories?: string
}

/**
 * Types de workouts disponibles par sport
 */
export const WORKOUT_TYPES_BY_SPORT = {
  crossfit: [
    { value: 'technique_metcon', label: 'Technique + MetCon' },
    { value: 'strength_max', label: 'Force Max (RM)' },
    { value: 'conditioning', label: 'Conditioning / MetCon' },
    { value: 'strength_accessory', label: 'Force + Accessoires' },
    { value: 'benchmark', label: 'Benchmark (Fran, Murph, etc.)' },
    { value: 'mixed', label: 'Mixte / Varié' },
  ],
  running: [
    { value: 'intervals', label: 'Intervalles' },
    { value: 'tempo', label: 'Tempo Run' },
    { value: 'long_run', label: 'Sortie Longue' },
    { value: 'fartlek', label: 'Fartlek' },
    { value: 'hill_repeats', label: 'Côtes' },
    { value: 'recovery', label: 'Récupération' },
  ],
  cycling: [
    { value: 'intervals', label: 'Intervalles' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'ftp_work', label: 'Travail FTP' },
    { value: 'vo2max', label: 'VO2max' },
    { value: 'recovery', label: 'Récupération' },
  ],
  musculation: [
    { value: 'strength', label: 'Force' },
    { value: 'hypertrophy', label: 'Hypertrophie' },
    { value: 'circuit', label: 'Circuit Training' },
    { value: 'upper_body', label: 'Haut du corps' },
    { value: 'lower_body', label: 'Bas du corps' },
    { value: 'full_body', label: 'Full Body' },
  ],
  cardio: [
    { value: 'low_impact', label: 'Bas Impact' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'circuit', label: 'Circuit Cardio' },
    { value: 'machines', label: 'Machines Cardio' },
    { value: 'steady_state', label: 'Cardio Continu' },
  ],
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
