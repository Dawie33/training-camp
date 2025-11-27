import { SaveBenchmarkResultDto } from '../types/benchmark'
import { CreateWorkoutDTO, GeneratedWorkout, PersonalizedWorkout, UpdateWorkoutDTO, WorkoutQueryParams, Workouts } from '../types/workout'
import apiClient from './apiClient'
import ResourceApi from './resourceApi'

// Re-export types
export type { GeneratedWorkout }

export const workoutsApi = new ResourceApi<Workouts, CreateWorkoutDTO, UpdateWorkoutDTO>('/workouts')

// Helper functions for backward compatibility
export const createWorkout = (data: CreateWorkoutDTO) => workoutsApi.create(data)
export const generateWorkoutWithAI = (data: {
  sport: string
  workoutType: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  duration: number
  focus?: string[]
  equipment?: string[]
  constraints?: string[]
  additionalInstructions?: string
}) => workoutsService.generateWorkoutWithAI(data)

export class WorkoutsService {

  /**
   * Récupère toutes les séances d'entraînement avec des paramètres de requête optionnels.
   * Retourne la réponse complète du backend avec rows et count.
   *
   * @param query Paramètres de requête (limit, offset, search, etc.)
   * @returns Promesse contenant { rows: Workouts[], count: number }
   */
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
   * @param data Données du workout à créer
   * @returns Promesse contenant le workout créé
   */
  async create(data: CreateWorkoutDTO): Promise<Workouts> {
    return workoutsApi.create(data)
  }

  /**
   * Met à jour un workout existant.
   * @param id ID du workout à mettre à jour
   * @param data Données à mettre à jour
   * @returns Promesse contenant le workout mis à jour
   */
  async update(id: string, data: UpdateWorkoutDTO): Promise<Workouts> {
    return workoutsApi.update(id, data)
  }

  /**
   * Supprime un workout par son ID.
   * @param id ID du workout à supprimer
   * @returns Promesse qui renvoie void une fois le workout supprimé
   */
  async delete(id: string): Promise<void> {
    return workoutsApi.delete(id)
  }

  /**
   * Récupère le workout du jour
   * @returns Promesse contenant le workout du jour
   */
  async getDailyWorkout(): Promise<Workouts> {
    return apiClient.get<Workouts>('/workouts/daily')
  }

  /**
   * Crée un nouveau workout personnalisé.
   * @param data Données du workout à créer
   * @returns Promesse contenant le workout créé
   */
  async createPersonalizedWorkout(data: Workouts): Promise<Workouts> {
    return apiClient.post<Workouts>('/workouts/personalized', data)
  }

  /**
   * Récupère les workouts personnalisés associés à l'utilisateur courant.
   * @param limit Nombre maximum de résultats (défaut: 20)
   * @param offset Offset pour la pagination (défaut: 0)
   * @param search Terme de recherche optionnel
   * @param difficulty Filtre par difficulté
   * @param intensity Filtre par intensité
   * @param minDuration Durée minimale en minutes
   * @param maxDuration Durée maximale en minutes
   * @returns Promesse contenant { rows: PersonalizedWorkout[], count: number }
   */
  async getPersonalizedWorkouts(
    limit = 20,
    offset = 0,
    search?: string,
    difficulty?: string,
    intensity?: string,
    minDuration?: number,
    maxDuration?: number
  ): Promise<{ rows: PersonalizedWorkout[], count: number }> {
    const params: Record<string, string | number> = {
      limit,
      offset
    }

    if (search) params.search = search
    if (difficulty) params.difficulty = difficulty
    if (intensity) params.intensity = intensity
    if (minDuration !== undefined) params.minDuration = minDuration
    if (maxDuration !== undefined) params.maxDuration = maxDuration

    return apiClient.get<{ rows: PersonalizedWorkout[], count: number }>('/workouts/personalized', {
      params
    })
  }

  /**
   * Récupère un workout personnalisé par son ID.
   * @param id ID du workout personnalisé
   * @returns Promesse contenant le workout personnalisé
   */
  async getPersonalizedWorkout(id: string): Promise<PersonalizedWorkout> {
    return apiClient.get<PersonalizedWorkout>(`/workouts/personalized/${id}`)
  }

  /**
   * Supprime un workout personnalisé.
   * @param id ID du workout personnalisé à supprimer
   * @returns Promesse qui renvoie le résultat de la suppression
   */
  async deletePersonalizedWorkout(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/workouts/personalized/${id}`)
  }

  /**
   * Récupère les workouts de référence (benchmark) pour un sport donné ou tous les benchmarks.
   * Les benchmarks sont des workouts de référence pour évaluer le niveau.
   * @param sportId ID du sport (optionnel - si non fourni, retourne tous les benchmarks)
   * @returns Promesse contenant { rows: Workouts[], count: number }
   */
  async getBenchmarkWorkouts(sportId?: string): Promise<{ rows: Workouts[], count: number }> {
    const params = sportId ? { sportId } : {}
    return apiClient.get<{ rows: Workouts[], count: number }>('/workouts/benchmark', {
      params
    })
  }

  /**
   * Enregistre le résultat d'un benchmark
   * Le niveau de l'utilisateur sera automatiquement calculé et mis à jour
   * @param data Données du résultat du benchmark
   * @returns Promesse contenant le nouveau niveau et les résultats mis à jour
   */
  async saveBenchmarkResult(data: SaveBenchmarkResultDto): Promise<{
    success: boolean
    level: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    benchmark_results: Record<string, unknown>
  }> {
    return apiClient.post<{
      success: boolean
      level: 'beginner' | 'intermediate' | 'advanced' | 'elite'
      benchmark_results: Record<string, unknown>
    }>('/workouts/benchmark-result', data)
  }

  /**
   * Génère un workout avec l'IA en fonction des paramètres
   * Retourne uniquement le JSON du workout sans le sauvegarder
   * @param data Paramètres de génération du workout
   * @returns Promesse contenant le workout généré par l'IA
   */
  async generateWorkoutWithAI(data: {
    sport: string
    workoutType: string
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    duration: number
    focus?: string[]
    equipment?: string[]
    constraints?: string[]
    additionalInstructions?: string
  }): Promise<GeneratedWorkout> {
    return apiClient.post<GeneratedWorkout>('/workouts/generate-ai', data)
  }
}

export const workoutsService = new WorkoutsService()
