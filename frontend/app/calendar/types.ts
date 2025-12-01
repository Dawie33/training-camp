/**
 * Types pour la page Calendar
 */

export type ViewMode = 'day' | 'week' | 'month'

export interface DayWorkout {
  id: string
  scheduleId: string
  name: string
  type: 'scheduled' | 'completed' | 'skipped' | 'rescheduled'
  intensity?: string
  duration?: number
  difficulty?: string
  workout_type?: string
}

export interface CalendarDay {
  date: Date
  dayName: string
  dayNumber: number
  isToday: boolean
  isCurrentMonth?: boolean
  workouts: DayWorkout[]
}

