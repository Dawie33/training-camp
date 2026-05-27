import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { CreateWorkoutSessionDto, UpdateWorkoutSessionDto, WorkoutSession } from './dto/session.dto'

export interface RunningSegment {
  session_id: string
  workout_name: string | null
  date: string
  duration_seconds: number
  distance_meters: number
  avg_pace_min_km: number
  avg_heart_rate: number | null
  max_heart_rate: number | null
  activity_index: number
}


@Injectable()
export class WorkoutSessionsService {
    constructor(@InjectConnection() private readonly knex: Knex) { }

    /**
    * Récupère toutes les sessions d'un utilisateur
    * @param userId ID de l'utilisateur
    * @param limit Nombre de sessions à récupérer
    * @returns Liste des sessions
    */
    async findAll(userId: string, limit = 50, offset = 0): Promise<{ rows: WorkoutSession[], count: number }> {

        const rows = await this.knex('workout_sessions')
            .select('workout_sessions.*', 'workouts.name as workout_name')
            .leftJoin('workouts', 'workout_sessions.workout_id', 'workouts.id')
            .where({ 'workout_sessions.user_id': userId })
            .orderBy('workout_sessions.started_at', 'desc')
            .limit(Number(limit))
            .offset(Number(offset))

        const countResult = await this.knex('workout_sessions')
            .count('* as count')
            .where({ user_id: userId })
            .first()

        return { rows, count: Number(countResult?.count) }

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
        const insertData: Record<string, unknown> = {
            user_id: userId,
            started_at: data.started_at || new Date().toISOString(),
        }

        if (data.workout_id) {
            insertData.workout_id = data.workout_id
        }
        if (data.personalized_workout_id) {
            insertData.personalized_workout_id = data.personalized_workout_id
        }

        const [session] = await this.knex('workout_sessions')
            .insert(insertData)
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

    /**
     * Supprime une session de workout
     * @param sessionId ID de la session
     * @param userId ID de l'utilisateur (pour vérifier la propriété)
     * @returns true si la session a été supprimée, false sinon
     */
    async delete(sessionId: string, userId: string): Promise<boolean> {
        const deletedCount = await this.knex('workout_sessions')
            .where({ id: sessionId, user_id: userId })
            .delete()

        return deletedCount > 0
    }

    // Extrait tous les segments running des sessions qui ont des données FIT multi-activités
    async findRunningSegments(userId: string): Promise<RunningSegment[]> {
        const sessions = await this.knex('workout_sessions')
            .select(
                'workout_sessions.id',
                'workout_sessions.completed_at',
                'workout_sessions.results',
                'workouts.name as workout_name',
            )
            .leftJoin('workouts', 'workout_sessions.workout_id', 'workouts.id')
            .where('workout_sessions.user_id', userId)
            .whereNotNull('workout_sessions.completed_at')
            .whereRaw("jsonb_typeof(workout_sessions.results -> 'coros' -> 'activities') = 'array'")
            .orderBy('workout_sessions.completed_at', 'desc')

        const segments: RunningSegment[] = []

        for (const session of sessions) {
            const activities: Record<string, unknown>[] = session.results?.coros?.activities ?? []
            activities.forEach((activity, idx) => {
                const sport = String(activity.sport ?? '')
                const pace = activity.avg_pace_min_km as number | null
                if (sport.toLowerCase().includes('run') && pace) {
                    segments.push({
                        session_id: session.id,
                        workout_name: session.workout_name ?? null,
                        date: session.completed_at,
                        duration_seconds: (activity.duration_seconds as number) ?? 0,
                        distance_meters: (activity.distance_meters as number) ?? 0,
                        avg_pace_min_km: pace,
                        avg_heart_rate: (activity.avg_heart_rate as number | null) ?? null,
                        max_heart_rate: (activity.max_heart_rate as number | null) ?? null,
                        activity_index: idx,
                    })
                }
            })
        }

        return segments
    }

}
