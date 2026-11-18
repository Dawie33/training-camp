import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { UserContextService } from 'src/user-context/user-context.service'
import { WorkoutsService } from 'src/workouts/services/workouts.service'
import { applyVisibility } from 'src/workouts/services/workout-visibility'
import { CreateWorkoutSessionDto, UpdateWorkoutSessionDto, WorkoutSession } from './dto/session.dto'
import { SessionResults, SessionResultsSchema } from './schemas/session-results.schema'

@Injectable()
export class WorkoutSessionsService {
  constructor(
    @InjectConnection() private readonly knex: Knex,
    private readonly userContextService: UserContextService,
    private readonly workoutsService: WorkoutsService
  ) {}

  /**
   * Récupère toutes les sessions d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param limit Nombre de sessions à récupérer
   * @returns Liste des sessions
   */
  async findAll(userId: string, limit = 50, offset = 0): Promise<{ rows: WorkoutSession[]; count: number }> {
    const rows = await this.knex('workout_sessions')
      .select('workout_sessions.*', 'workouts.name as workout_name')
      .leftJoin('workouts', 'workout_sessions.workout_id', 'workouts.id')
      .where({ 'workout_sessions.user_id': userId })
      .orderBy('workout_sessions.started_at', 'desc')
      .orderBy('workout_sessions.id', 'desc')
      .limit(Number(limit))
      .offset(Number(offset))

    const countResult = await this.knex('workout_sessions').count('* as count').where({ user_id: userId }).first()

    return { rows, count: Number(countResult?.count) }
  }

  /**
   * Récupère une session par son ID
   * @param sessionId ID de la session
   * @param userId ID de l'utilisateur (pour vérifier la propriété)
   * @returns La session
   */
  async findOne(sessionId: string, userId: string): Promise<WorkoutSession | null> {
    const session = await this.knex('workout_sessions').where({ id: sessionId, user_id: userId }).first()

    return session || null
  }

  /**
   * Récupère les sessions d'un workout spécifique pour un utilisateur
   * @param workoutId ID du workout
   * @param userId ID de l'utilisateur
   * @returns Liste des sessions
   */
  async findByWorkout(workoutId: string, userId: string): Promise<WorkoutSession[]> {
    return this.knex('workout_sessions').where({ workout_id: workoutId, user_id: userId }).orderBy('started_at', 'desc')
  }

  /**
   * Crée une nouvelle session de workout
   * @param userId ID de l'utilisateur
   * @param data Données de création
   * @returns La session créée
   */
  async create(userId: string, data: CreateWorkoutSessionDto): Promise<WorkoutSession> {
    if (data.workout_id && data.personalized_workout_id) {
      throw new BadRequestException('Une séance ne peut référencer qu’un seul workout')
    }
    const startedAt = data.started_at ?? new Date().toISOString()
    this.validateDates(startedAt, data.completed_at)
    const results = data.results !== undefined ? this.validateResults(data.results) : undefined
    const session = await this.knex.transaction(async trx => {
      if (data.workout_id) {
        const workout = await applyVisibility(trx('workouts').where({ id: data.workout_id }), { id: userId }).first()
        if (!workout) throw new NotFoundException('Workout non trouvé')
      }
      if (data.personalized_workout_id) {
        const workout = await trx('personalized_workouts')
          .where({ id: data.personalized_workout_id, user_id: userId })
          .first()
        if (!workout) throw new NotFoundException('Workout personnalisé non trouvé')
      }
      let schedule:
        | {
            id: string
            workout_id: string | null
            personalized_workout_id: string | null
            completed_session_id: string | null
            session_type?: string
          }
        | undefined
      if (data.schedule_id) {
        schedule = await trx('user_workout_schedule')
          .where({ id: data.schedule_id, user_id: userId })
          .forUpdate()
          .first()
        if (!schedule) throw new NotFoundException('Planification non trouvée')
        const isUnboundBoxSession =
          schedule.session_type === 'box_session' && !schedule.workout_id && !schedule.personalized_workout_id
        if (
          !isUnboundBoxSession &&
          ((schedule.workout_id ?? undefined) !== data.workout_id ||
            (schedule.personalized_workout_id ?? undefined) !== data.personalized_workout_id)
        ) {
          throw new BadRequestException('La séance ne correspond pas au workout planifié')
        }
        if (schedule.session_type === 'rest')
          throw new BadRequestException('Un repos ne peut pas être complété par une séance')
        if (!data.completed_at) throw new BadRequestException('La séance planifiée doit être terminée')
        if (schedule.completed_session_id) {
          throw new ConflictException('Cette planification est déjà complétée')
        }
      }
      const [created] = await trx('workout_sessions')
        .insert({
          user_id: userId,
          workout_id: data.workout_id,
          personalized_workout_id: data.personalized_workout_id,
          started_at: startedAt,
          completed_at: data.completed_at,
          notes: data.notes,
          results: results ? JSON.stringify(results) : undefined,
        })
        .returning('*')
      await this.recordBenchmarkIfApplicable(trx, created)
      if (schedule) {
        await trx('user_workout_schedule').where({ id: schedule.id, user_id: userId }).update({
          status: 'completed',
          completed_session_id: created.id,
          updated_at: trx.fn.now(),
        })
      }
      return created
    })
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
  async update(sessionId: string, userId: string, data: UpdateWorkoutSessionDto): Promise<WorkoutSession | null> {
    const results = data.results !== undefined ? this.validateResults(data.results) : undefined
    const session = await this.knex.transaction(async trx => {
      const existing = await trx('workout_sessions').where({ id: sessionId, user_id: userId }).forUpdate().first()
      if (!existing) return null
      this.validateDates(existing.started_at, data.completed_at ?? existing.completed_at)
      const [updated] = await trx('workout_sessions')
        .where({ id: sessionId, user_id: userId })
        .update({
          ...data,
          results: results ? JSON.stringify(results) : undefined,
          ai_analysis: null,
          updated_at: trx.fn.now(),
        })
        .returning('*')
      if (results !== undefined || data.completed_at !== undefined) await this.recordBenchmarkIfApplicable(trx, updated)
      return updated
    })
    this.userContextService.invalidateCache(userId)

    return session || null
  }

  /**
   * Valide le payload `results` contre le contrat de séance.
   *
   * Le schéma laisse passer les clés inconnues : les séances enregistrées avant
   * l'introduction du format structuré (`exercise_details` en texte libre, données
   * Coros, progression par bloc) restent modifiables sans migration.
   * @param results Résultats bruts envoyés par le client
   * @returns Les résultats validés
   * @throws BadRequestException si une clé connue est hors contrat
   */
  private validateResults(results: Record<string, unknown>): SessionResults {
    const parsed = SessionResultsSchema.safeParse(results)
    if (!parsed.success) {
      const detail = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(' | ')
      throw new BadRequestException(`Résultats de séance invalides — ${detail}`)
    }

    return parsed.data
  }

  private validateDates(startedAt: string, completedAt?: string | null): void {
    const start = new Date(startedAt).getTime()
    const end = completedAt == null ? undefined : new Date(completedAt).getTime()
    if (!Number.isFinite(start) || (end !== undefined && (!Number.isFinite(end) || end < start))) {
      throw new BadRequestException('La fin de séance doit être une date valide postérieure ou égale au début')
    }
  }

  /**
   * Si le workout loggué est un benchmark, extrait le score depuis les résultats de la
   * séance (format utilisé par les pages de log par sport) et historise le résultat.
   * @param trx Transaction de la séance
   * @param session Séance complète, avec ses résultats et sa date de réalisation
   */
  private async recordBenchmarkIfApplicable(trx: Knex.Transaction, session: WorkoutSession): Promise<void> {
    if (!session.workout_id || !session.completed_at) return
    const workout = await trx('workouts').where({ id: session.workout_id }).first()
    if (!workout?.is_benchmark) return

    const results = session.results ?? {}
    const timeSeconds = results.elapsed_time_seconds
    const rounds = results.rounds
    const reps = results.reps

    if (results.cap_reached || (timeSeconds === undefined && rounds === undefined)) {
      await this.workoutsService.removeSessionBenchmark(trx, session.user_id, session.id)
      return
    }

    await this.workoutsService.recordBenchmarkResult(
      session.user_id,
      session.workout_id,
      workout.name,
      { time_seconds: timeSeconds, rounds, reps },
      'manual',
      { sessionId: session.id, measuredAt: session.completed_at, transaction: trx }
    )
  }

  /**
   * Supprime une session de workout
   * @param sessionId ID de la session
   * @param userId ID de l'utilisateur (pour vérifier la propriété)
   * @returns true si la session a été supprimée, false sinon
   */
  async delete(sessionId: string, userId: string): Promise<boolean> {
    const deleted = await this.knex.transaction(async trx => {
      const session = await trx('workout_sessions').where({ id: sessionId, user_id: userId }).forUpdate().first()
      if (!session) return false
      await trx('user_workout_schedule').where({ completed_session_id: sessionId, user_id: userId }).update({
        status: 'scheduled',
        completed_session_id: null,
        updated_at: trx.fn.now(),
      })
      await this.workoutsService.removeSessionBenchmark(trx, userId, sessionId)
      await trx('workout_sessions').where({ id: sessionId, user_id: userId }).delete()
      return true
    })

    if (deleted) {
      this.userContextService.invalidateCache(userId)
    }

    return deleted
  }
}
