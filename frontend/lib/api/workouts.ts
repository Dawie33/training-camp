import { CreateWorkoutDTO, UpdateWorkoutDTO, WorkoutQueryParams, Workouts } from '../types/workout'
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
   * Récupère les workouts recommandés pour un sport
   * @param sportId ID du sport
   * @param limit Nombre maximum de workouts à récupérer
   * @returns Promesse contenant { rows: Workouts[], count: number }
   */
  async getRecommendedWorkouts(sportId: string, limit: number = 10) {
    return workoutsApi.getAll({
      sport_id: sportId,
      limit,
      // On pourrait ajouter d'autres paramètres pour personnaliser les recommandations
    })
  }

  /**
   * Récupère le workout du jour pour un sport donné
   * @param sportId ID du sport
   * @param date Date au format ISO (YYYY-MM-DD). Si non fourni, récupère le dernier workout
   * @returns Promesse contenant le workout du jour
   */
  async getDailyWorkout(sportId: string, date?: string): Promise<Workouts> {
    const response = await workoutsApi.getAll({
      sport_id: sportId,
      limit: 1,
      // Vous pouvez ajouter un paramètre de date si votre API le supporte
    })

    if (!response.rows || response.rows.length === 0) {
      throw new Error('No workout found')
    }

    return response.rows[0]
  }
}



export const workoutsService = new WorkoutsService()