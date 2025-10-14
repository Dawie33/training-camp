import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { CreateWorkoutSessionDto, UpdateWorkoutSessionDto, WorkoutSession } from '../dto/session.dto'


@Injectable()
export class WorkoutSessionsService {
  constructor(@InjectConnection() private readonly knex: Knex) { }

  /**
  * Récupère toutes les sessions d'un utilisateur
  * @param userId ID de l'utilisateur
  * @param limit Nombre de sessions à récupérer
  * @returns Liste des sessions
  */
  async findAll(userId: string, limit = 50): Promise<WorkoutSession[]> {
    return this.knex('workout_sessions')
      .where({ user_id: userId })
      .orderBy('started_at', 'desc')
      .limit(limit)
  }

  /**
   * Récupère une session par son ID
   * @param sessionId ID de la session
   * @param userId ID de l'utilisateur (pour vérifier la propriété)
   * @returns La session
   */
  async findOne(sessionId: string, userId: string): Promise<WorkoutSession | null> {
    const session = await this.knex('workout_sessions')
      .where({ id: sessionId, user_id: userId })
      .first()

    return session || null
  }

  /**
   * Récupère les sessions d'un workout spécifique pour un utilisateur
   * @param workoutId ID du workout
   * @param userId ID de l'utilisateur
   * @returns Liste des sessions
   */
  async findByWorkout(workoutId: string, userId: string): Promise<WorkoutSession[]> {
    return this.knex('workout_sessions')
      .where({ workout_id: workoutId, user_id: userId })
      .orderBy('started_at', 'desc')
  }

  /**
  * Crée une nouvelle session de workout
  * @param userId ID de l'utilisateur
  * @param data Données de création
  * @returns La session créée
  */
  async create(userId: string, data: CreateWorkoutSessionDto): Promise<WorkoutSession> {
    const [session] = await this.knex('workout_sessions')
      .insert({
        workout_id: data.workout_id,
        user_id: userId,
        started_at: data.started_at || new Date().toISOString(),
      })
      .returning('*')

    return session
  }

  /**
   * Met à jour une session de workout
   * @param sessionId ID de la session
   * @param userId ID de l'utilisateur (pour vérifier la propriété)
   * @param data Données de mise à jour
   * @returns La session mise à jour
   */
  async update(
    sessionId: string,
    userId: string,
    data: UpdateWorkoutSessionDto
  ): Promise<WorkoutSession | null> {
    const [session] = await this.knex('workout_sessions')
      .where({ id: sessionId, user_id: userId })
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .returning('*')

    return session || null
  }

}
