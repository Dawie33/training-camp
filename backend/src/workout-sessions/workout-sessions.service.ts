import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { WorkoutsService } from 'src/workouts/services/workouts.service'
import { CreateWorkoutSessionDto, UpdateWorkoutSessionDto, WorkoutSession } from './dto/session.dto'

@Injectable()
export class WorkoutSessionsService {
    constructor(
        @InjectConnection() private readonly knex: Knex,
        private readonly userContextService: UserContextService,
        private readonly workoutsService: WorkoutsService
    ) { }

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

        this.userContextService.invalidateCache(userId)

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

        if (session?.workout_id && data.results) {
            await this.recordBenchmarkIfApplicable(userId, session.workout_id, data.results)
        }

        this.userContextService.invalidateCache(userId)

        return session || null
    }

    /**
     * Si le workout loggué est un benchmark, extrait le score depuis les résultats de la
     * séance (format utilisé par les pages de log par sport) et historise le résultat.
     * @param userId ID de l'utilisateur
     * @param workoutId ID du workout loggué
     * @param results Résultats de la séance (elapsed_time_seconds / rounds / reps...)
     */
    private async recordBenchmarkIfApplicable(
        userId: string,
        workoutId: string,
        results: Record<string, unknown>
    ): Promise<void> {
        const workout = await this.knex('workouts').where({ id: workoutId }).first()
        if (!workout?.is_benchmark) return

        const timeSeconds = results.elapsed_time_seconds as number | undefined
        const rounds = results.rounds as number | undefined
        const reps = results.reps as number | undefined

        if (timeSeconds === undefined && rounds === undefined) return

        await this.workoutsService.recordBenchmarkResult(
            userId,
            workoutId,
            workout.name,
            { time_seconds: timeSeconds, rounds, reps },
            'manual'
        )
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

        if (deletedCount > 0) {
            this.userContextService.invalidateCache(userId)
        }

        return deletedCount > 0
    }

}
