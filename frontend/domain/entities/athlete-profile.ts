export const GOALS = {
  weight_loss: 'Perte de poids',
  muscle_gain: 'Prise de masse',
  endurance: 'Endurance',
  strength: 'Force',
  flexibility: 'Mobilité',
  performance: 'Performance',
} as const

export const AVAILABLE_DAYS = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
} as const

export type GlobalGoals = Partial<Record<keyof typeof GOALS, boolean>>
export interface TrainingPreferences {
  preferred_duration?: number
  sessions_per_week?: number
}
export interface SchedulePreferences {
  available_days?: Array<keyof typeof AVAILABLE_DAYS>
}
