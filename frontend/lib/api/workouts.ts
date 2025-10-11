import { Workouts, WorkoutSession, WorkoutSessionCreate, WorkoutSessionUpdate } from '../types/workout'
import { apiClient } from './apiClient'



/**
 * Service Workouts - Gestion des workouts et sessions
 */
export class WorkoutsServie {
  /**
   * Récupère un workout par son ID
   * @param workoutId Identifiant du workout
   * @returns Le workout correspondant
   */
  async getDailyWorkoutById(workoutId: string): Promise<Workouts> {
    return apiClient.get<Workouts>(`/workouts/daily/${workoutId}`)
  }

  /**
   * Récupère le workout du jour pour un sport donné
   * @param sportId Identifiant du sport
   * @param date Date optionnelle (YYYY-MM-DD), par défaut aujourd'hui
   * @returns Le workout du jour
   */
  async getDailyWorkout(sportId: string, date?: string): Promise<Workouts> {
    return apiClient.get<Workouts>(`/workouts/daily/${sportId}`, {
      params: date ? { date } : undefined
    })
  }

  /**
   * Démarre une nouvelle session de workout
   * @param data Données de la session à créer
   * @returns La session créée
   */
  async startSession(data: WorkoutSessionCreate): Promise<WorkoutSession> {
    const token = localStorage.getItem('access_token')
    return apiClient.post<WorkoutSession>('/workout-sessions', data, {
      headers: { Authorization: `Bearer ${token}` }
    })
  }

  /**
   * Met à jour une session de workout existante
   * @param sessionId Identifiant de la session
   * @param data Données à mettre à jour
   * @returns La session mise à jour
   */
  async updateSession(sessionId: string, data: WorkoutSessionUpdate): Promise<WorkoutSession> {
    const token = localStorage.getItem('access_token')
    return apiClient.patch<WorkoutSession>(`/workout-sessions/${sessionId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
  }

  /**
   * Récupère une session de workout
   * @param sessionId Identifiant de la session
   * @returns La session correspondante
   */
  async getSession(sessionId: string): Promise<WorkoutSession> {
    const token = localStorage.getItem('access_token')
    return apiClient.get<WorkoutSession>(`/workout-sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  }
}

export const workoutsService = new WorkoutsServie()