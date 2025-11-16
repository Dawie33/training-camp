import { CreateWorkoutDTO, PersonalizedWorkout, UpdateWorkoutDTO, WorkoutQueryParams, Workouts } from '../types/workout'
import { apiClient } from './apiClient'
import { ResourceApi } from './resourceApi'


export const workoutsApi = new ResourceApi<Workouts, CreateWorkoutDTO, UpdateWorkoutDTO>('/workouts')

export class WorkoutsService {

  /**
   * Récupère toutes les séances d'entraînement avec des paramètres de requête optionnels.
   * Retourne la réponse complète du backend avec rows et count.
   *
   * @param query Paramètres de requête (limit, offset, search, etc.)
   * @returns Promesse contenant { rows: WorkoutSession[], count: number }
   * */
  async getAll(query?: WorkoutQueryParams) {
    return workoutsApi.getAll(query)
  }

  /**
   * Récupère un workout par son ID
   * @param workoutId ID du workout
   * @returns Le workout correspondant
   */
  async getById(workoutId: string): Promise<Workouts> {
    return workoutsApi.getOne(workoutId)
  }

  /**
   * Crée un nouveau workout.
   * @param data Données du workout à créer.
   * @returns Promesse contenant le workout créé.
   */
  async create(data: CreateWorkoutDTO): Promise<Workouts> {
    return workoutsApi.create(data)
  }

  /**
   * Met à jour un workout existant.
   * @param id ID du workout à mettre à jour.
   * @param data Données à mettre à jour.
   * @returns Promesse contenant le workout mis à jour.
   */
  async update(id: string, data: UpdateWorkoutDTO): Promise<Workouts> {
    return workoutsApi.update(id, data)
  }

  /**
   * Supprime un workout par son ID.
   * @param id ID du workout à supprimer.
   * @returns Promesse qui renvoie void une fois le workout supprimé.
   */
  async delete(id: string): Promise<void> {
    return workoutsApi.delete(id)
  }

  /**
   * Récupère le workout du jour pour un sport donné
   * @param sportId ID du sport
   * @param date Date au format ISO (YYYY-MM-DD). Si non fourni, récupère le dernier workout
   * @returns Promesse contenant le workout du jour
   */
  async getDailyWorkout() {
    const response = await apiClient.get<Workouts>(`/workouts/daily`)
    return response
  }

  /**
   * Crée un nouveau workout personnalisé.
   * Les données sont transmises via le body de la requête.
   * @param data Données du workout à créer.
   * @returns Promesse contenant le workout créé.
   */
  async createPersonalizedWorkout(data: Workouts) {
    const response = await apiClient.post<Workouts>('/workouts/personalized', data)
    return response
  }

  /**
   * Récupère les workouts personnalisés associés à l'utilisateur courant.
   * @returns Promesse contenant { rows: Workouts[], count: number }
   * */
  async getPersonalizedWorkouts(
    limit = 20,
    offset = 0,
    search?: string,
    difficulty?: string,
    intensity?: string,
    minDuration?: number,
    maxDuration?: number
  ) {
    const params: Record<string, string | number> = {
      limit,
      offset
    }

    if (search) params.search = search
    if (difficulty) params.difficulty = difficulty
    if (intensity) params.intensity = intensity
    if (minDuration) params.minDuration = minDuration
    if (maxDuration) params.maxDuration = maxDuration

    const response = await apiClient.get<{ rows: PersonalizedWorkout[], count: number }>('/workouts/personalized', {
      params
    })
    return response
  }

  /**
   * Récupère un workout personnalisé par son ID.
   * @param {string} id - ID du workout personnalisé.
   * @returns {Promise<PersonalizedWorkout>} - Promesse contenant le workout personnalisé.
   */
  async getPersonalizedWorkout(id: string) {
    const response = await apiClient.get<PersonalizedWorkout>(`/workouts/personalized/${id}`)
    return response
  }

  /**
   * Récupère les workouts de référence (benchmark) pour un sport donné.
   * Les benchmarks sont des workouts de référence pour évaluer le niveau.
   * @param sportId ID du sport
   * @returns Promesse contenant { rows: Workouts[], count: number }
   */
  async getBenchmarkWorkouts(sportId: string): Promise<{ rows: Workouts[], count: number }> {
    const response = await apiClient.get<{ rows: Workouts[], count: number }>(`/workouts/benchmark`, {
      params: {
        sportId: sportId
      }
    })
    return response
  }

}



export const workoutsService = new WorkoutsService()