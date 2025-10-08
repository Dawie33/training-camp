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
  intensity: string
  name: string
  difficulty: string
  estimated_duration?: number
  coach_notes?: string
  slug: string
  blocks: WorkoutBlocks
  workout_type: string
  description: string
  scheduled_date: string
  tags: string[]
  status: string
}

export interface WorkoutSessionCreate {
  workout_id: string
  started_at?: string
}

export interface WorkoutSessionUpdate {
  completed_at?: string
  notes?: string
  results?: Record<string, unknown>
}

export interface WorkoutSession {
  id: string
  workout_id: string
  user_id: string
  started_at: string
  completed_at?: string
  notes?: string
  results?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export const workoutsService = {
  /**
   * Récupère un workout par son ID
   * @param workoutId ID du workout
   * @returns Le workout
   */
  async getDailyWorkoutById(workoutId: string): Promise<DailyWorkout> {
    return apiClient.get<DailyWorkout>(`/workouts/daily/${workoutId}`)
  },

  /**
   * Récupère le workout du jour pour un sport donné
   * @param sportId ID du sport
   * @param date Date optionnelle (YYYY-MM-DD), par défaut aujourd'hui
   * @returns Le workout du jour
   */
  async getDailyWorkout(sportId: string, date?: string): Promise<DailyWorkout> {
    const url = `/workouts/daily/sports/${sportId}${date ? `?date=${date}` : ''}`
    return apiClient.get<DailyWorkout>(url)
  },

  /**
   * Démarre une nouvelle session de workout
   * @param data Les données de la session
   * @returns La session créée
   */
  async startSession(data: WorkoutSessionCreate): Promise<WorkoutSession> {
    const token = localStorage.getItem('access_token')
    return apiClient.post<WorkoutSession>('/api/workout-sessions', data, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },

  /**
   * Met à jour une session de workout existante
   * @param sessionId ID de la session
   * @param data Les données à mettre à jour
   * @returns La session mise à jour
   */
  async updateSession(sessionId: string, data: WorkoutSessionUpdate): Promise<WorkoutSession> {
    const token = localStorage.getItem('access_token')
    return apiClient.patch<WorkoutSession>(`/workout-sessions/${sessionId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },

  /**
   * Récupère une session de workout
   * @param sessionId ID de la session
   * @returns La session
   */
  async getSession(sessionId: string): Promise<WorkoutSession> {
    const token = localStorage.getItem('access_token')
    return apiClient.get<WorkoutSession>(`/workout-sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
}
