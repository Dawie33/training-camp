import { apiClient } from './client'

export interface WorkoutExercise {
  movement: string
  reps?: number
  duration_sec?: number
  equipment?: string[]
  name?: string
}

export interface WorkoutPart {
  movement: string
  reps: number
  equipment?: string[]
}

export interface StrengthBlock {
  name: string
  scheme: string
  rest_sec?: number
  equipment?: string[]
}

export interface MetconBlock {
  format: string
  time_cap_min?: number
  parts?: WorkoutPart[]
}

export interface WorkoutBlocks {
  warmup?: WorkoutExercise[]
  strength?: StrengthBlock
  metcon?: MetconBlock
  accessory?: Array<{ scheme: string; movement: string }>
  cooldown?: WorkoutExercise[]
  stimulus?: string
  duration_min?: number
}

export interface DailyWorkout {
  id: string
  wod_date: string
  status: string
  sport_id: string
  blocks: WorkoutBlocks
  tags: string[]
  created_at: string
  updated_at: string
}

export const workoutsService = {
  /**
   * Récupère le workout du jour pour un sport donné
   * @param sportId ID du sport
   * @param date Date optionnelle (YYYY-MM-DD), par défaut aujourd'hui
   * @returns Le workout du jour
   */
  async getDailyWorkout(sportId: string, date?: string): Promise<DailyWorkout> {
    const url = `/api/workouts/daily/${sportId}${date ? `?date=${date}` : ''}`
    return apiClient.get<DailyWorkout>(url)
  },
}
