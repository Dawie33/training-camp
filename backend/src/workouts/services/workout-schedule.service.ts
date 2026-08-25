import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { GoogleCalendarService } from '../../google-calendar/google-calendar.service'
import { CreateScheduleDto, ScheduleQueryDto, UpdateScheduleDto } from '../dto/schedule.dto'

@Injectable()
export class WorkoutScheduleService {
  constructor(
    @InjectModel() private readonly knex: Knex,
    private readonly googleCalendarService: GoogleCalendarService,
  ) { }

  /**
   * Récupère toutes les planifications d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param query Paramètres de recherche et pagination
   * @returns Liste des planifications avec les informations du workout
   */
  async findAllByUser(userId: string, query: ScheduleQueryDto) {
    const { limit = '50', offset = '0', start_date, end_date, status, workout_id } = query

    let queryBuilder = this.knex('user_workout_schedule')
      .select(
        'user_workout_schedule.*',
        this.knex.raw(`COALESCE(workouts.name, personalized_workouts.plan_json->>'name') as workout_name`),
        this.knex.raw(`COALESCE(workouts.workout_type, personalized_workouts.plan_json->>'workout_type') as workout_type`),
        this.knex.raw(`COALESCE(workouts.difficulty, personalized_workouts.plan_json->>'difficulty') as difficulty`),
        this.knex.raw(`COALESCE(workouts.intensity, personalized_workouts.plan_json->>'intensity') as intensity`),
        this.knex.raw(`COALESCE(workouts.estimated_duration, CAST(NULLIF(personalized_workouts.plan_json->>'estimated_duration', '') AS INTEGER)) as estimated_duration`),
      )
      .leftJoin('workouts', 'user_workout_schedule.workout_id', 'workouts.id')
      .leftJoin('personalized_workouts', 'user_workout_schedule.personalized_workout_id', 'personalized_workouts.id')
      .where('user_workout_schedule.user_id', userId)

    if (start_date) {
      queryBuilder = queryBuilder.where('user_workout_schedule.scheduled_date', '>=', start_date)
    }

    if (end_date) {
      queryBuilder = queryBuilder.where('user_workout_schedule.scheduled_date', '<=', end_date)
    }

    if (status) {
      queryBuilder = queryBuilder.where('user_workout_schedule.status', status)
    }

    if (workout_id) {
      queryBuilder = queryBuilder.where('user_workout_schedule.workout_id', workout_id)
    }

    const rows = await queryBuilder
      .limit(Number(limit))
      .offset(Number(offset))
      .orderBy('user_workout_schedule.scheduled_date', 'asc')

    // Count query
    let countQuery = this.knex('user_workout_schedule')
      .count('* as count')
      .where('user_id', userId)

    if (start_date) {
      countQuery = countQuery.where('scheduled_date', '>=', start_date)
    }

    if (end_date) {
      countQuery = countQuery.where('scheduled_date', '<=', end_date)
    }

    if (status) {
      countQuery = countQuery.where('status', status)
    }

    if (workout_id) {
      countQuery = countQuery.where('workout_id', workout_id)
    }

    const countResult = await countQuery.first()

    return {
      rows,
      count: Number(countResult?.count || 0),
    }
  }

  /**
   * Récupère une planification spécifique
   * @param id ID de la planification
   * @param userId ID de l'utilisateur
   * @returns La planification avec les détails du workout
   */
  async findOne(id: string, userId: string) {
    const schedule = await this.knex('user_workout_schedule')
      .select(
        'user_workout_schedule.*',
        this.knex.raw(`COALESCE(workouts.name, personalized_workouts.plan_json->>'name') as workout_name`),
        this.knex.raw(`COALESCE(workouts.workout_type, personalized_workouts.plan_json->>'workout_type') as workout_type`),
        this.knex.raw(`COALESCE(workouts.difficulty, personalized_workouts.plan_json->>'difficulty') as difficulty`),
        this.knex.raw(`COALESCE(workouts.intensity, personalized_workouts.plan_json->>'intensity') as intensity`),
        this.knex.raw(`COALESCE(workouts.estimated_duration, CAST(NULLIF(personalized_workouts.plan_json->>'estimated_duration', '') AS INTEGER)) as estimated_duration`),
      )
      .leftJoin('workouts', 'user_workout_schedule.workout_id', 'workouts.id')
      .leftJoin('personalized_workouts', 'user_workout_schedule.personalized_workout_id', 'personalized_workouts.id')
      .where('user_workout_schedule.id', id)
      .where('user_workout_schedule.user_id', userId)
      .first()

    if (!schedule) {
      throw new NotFoundException('Planification non trouvée')
    }

    return schedule
  }

  /**
   * Récupère la planification pour une date spécifique
   * @param userId ID de l'utilisateur
   * @param date Date au format YYYY-MM-DD
   * @returns La planification pour cette date ou null
   */
  async findByDate(userId: string, date: string) {
    const schedule = await this.knex('user_workout_schedule')
      .select(
        'user_workout_schedule.*',
        this.knex.raw(`COALESCE(workouts.name, personalized_workouts.plan_json->>'name') as workout_name`),
        this.knex.raw(`COALESCE(workouts.workout_type, personalized_workouts.plan_json->>'workout_type') as workout_type`),
        this.knex.raw(`COALESCE(workouts.difficulty, personalized_workouts.plan_json->>'difficulty') as difficulty`),
        this.knex.raw(`COALESCE(workouts.intensity, personalized_workouts.plan_json->>'intensity') as intensity`),
        this.knex.raw(`COALESCE(workouts.estimated_duration, CAST(NULLIF(personalized_workouts.plan_json->>'estimated_duration', '') AS INTEGER)) as estimated_duration`),
      )
      .leftJoin('workouts', 'user_workout_schedule.workout_id', 'workouts.id')
      .leftJoin('personalized_workouts', 'user_workout_schedule.personalized_workout_id', 'personalized_workouts.id')
      .where('user_workout_schedule.user_id', userId)
      .where('user_workout_schedule.scheduled_date', date)
      .first()

    return schedule || null
  }

  /**
   * Crée une nouvelle planification
   * @param userId ID de l'utilisateur
   * @param data Données de la planification
   * @returns La planification créée
   */
  async create(userId: string, data: CreateScheduleDto) {
    const isBoxSession = data.session_type === 'box_session'

    if (!isBoxSession && !data.workout_id && !data.personalized_workout_id) {
      throw new BadRequestException('workout_id ou personalized_workout_id est requis')
    }

    let workoutName = isBoxSession ? 'Jour Box CrossFit' : 'Workout'
    let workoutType: string | undefined
    let workoutDuration: number | undefined

    if (data.workout_id) {
      // Vérifier si le workout standard existe
      const workout = await this.knex('workouts').where('id', data.workout_id).first()
      if (!workout) {
        throw new NotFoundException('Workout non trouvé')
      }
      workoutName = workout.name
      workoutType = workout.workout_type
      workoutDuration = workout.estimated_duration
    } else if (data.personalized_workout_id) {
      // Vérifier si le workout personnalisé existe et appartient à l'utilisateur
      const pw = await this.knex('personalized_workouts')
        .where('id', data.personalized_workout_id)
        .where('user_id', userId)
        .first()
      if (!pw) {
        throw new NotFoundException('Workout personnalisé non trouvé')
      }
      workoutName = pw.plan_json?.name || 'Workout Personnalisé'
      workoutType = pw.plan_json?.workout_type
      workoutDuration = pw.plan_json?.estimated_duration
    }

    // Vérifier qu'il n'y a pas déjà une planification pour cette date
    const existing = await this.knex('user_workout_schedule')
      .where('user_id', userId)
      .where('scheduled_date', data.scheduled_date)
      .first()

    if (existing) {
      throw new ConflictException('Un workout est déjà planifié pour cette date')
    }

    const [schedule] = await this.knex('user_workout_schedule')
      .insert({
        user_id: userId,
        workout_id: data.workout_id || null,
        personalized_workout_id: data.personalized_workout_id || null,
        scheduled_date: data.scheduled_date,
        session_type: data.session_type || 'workout',
        location: data.location || null,
        notes: data.notes || null,
        status: 'scheduled',
      })
      .returning('*')

    // Sync vers Google Calendar (sans bloquer si non connecté ou en cas d'erreur)
    try {
      await this.googleCalendarService.syncWorkout(userId, {
        name: workoutName,
        scheduledDate: data.scheduled_date,
        duration: workoutDuration,
        type: workoutType,
      })
    } catch {
      // Google Calendar non connecté ou erreur silencieuse
    }

    return schedule
  }

  /**
   * Met à jour une planification
   * @param id ID de la planification
   * @param userId ID de l'utilisateur
   * @param data Données de mise à jour
   * @returns La planification mise à jour
   */
  async update(id: string, userId: string, data: UpdateScheduleDto) {
    // Vérifier que la planification existe et appartient à l'utilisateur
    const existing = await this.knex('user_workout_schedule')
      .where('id', id)
      .where('user_id', userId)
      .first()

    if (!existing) {
      throw new NotFoundException('Planification non trouvée')
    }

    // Si on change la date, vérifier qu'il n'y a pas de conflit
    if (data.scheduled_date && data.scheduled_date !== existing.scheduled_date) {
      const conflict = await this.knex('user_workout_schedule')
        .where('user_id', userId)
        .where('scheduled_date', data.scheduled_date)
        .whereNot('id', id)
        .first()

      if (conflict) {
        throw new ConflictException('Un workout est déjà planifié pour cette date')
      }
    }

    const [schedule] = await this.knex('user_workout_schedule')
      .where('id', id)
      .where('user_id', userId)
      .update({
        scheduled_date: data.scheduled_date ?? existing.scheduled_date,
        status: data.status ?? existing.status,
        completed_session_id: data.completed_session_id ?? existing.completed_session_id,
        location: data.location ?? existing.location,
        notes: data.notes ?? existing.notes,
        updated_at: new Date(),
      })
      .returning('*')

    return schedule
  }

  /**
   * Supprime une planification
   * @param id ID de la planification
   * @param userId ID de l'utilisateur
   */
  async delete(id: string, userId: string) {
    const deleted = await this.knex('user_workout_schedule')
      .where('id', id)
      .where('user_id', userId)
      .delete()

    if (deleted === 0) {
      throw new NotFoundException('Planification non trouvée')
    }

    return { success: true }
  }

  /**
   * Marque une planification comme complétée
   * @param id ID de la planification
   * @param userId ID de l'utilisateur
   * @param sessionId ID de la session d'entraînement
   */
  async markAsCompleted(id: string, userId: string, sessionId?: string) {
    return this.update(id, userId, {
      status: 'completed',
      completed_session_id: sessionId,
    })
  }

  /**
   * Marque une planification comme sautée
   * @param id ID de la planification
   * @param userId ID de l'utilisateur
   */
  async markAsSkipped(id: string, userId: string) {
    return this.update(id, userId, {
      status: 'skipped',
    })
  }

  /**
   * Suggère une configuration de semaine basée sur l'historique des 3 dernières semaines.
   * Lit à la fois les jours Box (`user_workout_schedule`) et les tags de séance
   * WOD/Conditioning/Mobilité/Force (`scheduled_activities`) pour reconstituer, par jour
   * de la semaine, ce qui revient le plus souvent (aucun appel IA).
   */
  async suggestWeek(
    userId: string,
    weekStart: string
  ): Promise<{ days: { date: string; isBox: boolean; isRest: boolean; types: string[] }[]; weeks_analyzed: number }> {
    const weekStartDate = new Date(weekStart + 'T00:00:00Z')
    const historyStartDate = new Date(weekStartDate)
    historyStartDate.setUTCDate(historyStartDate.getUTCDate() - 21)
    const historyStart = historyStartDate.toISOString().split('T')[0]

    const [boxRows, activityRows] = await Promise.all([
      this.knex('user_workout_schedule')
        .select('scheduled_date')
        .where('user_id', userId)
        .where('session_type', 'box_session')
        .where('scheduled_date', '>=', historyStart)
        .where('scheduled_date', '<', weekStart),
      this.knex('scheduled_activities')
        .select('scheduled_date', 'activity_type')
        .where('user_id', userId)
        .whereIn('activity_type', ['wod', 'conditioning', 'mobility', 'strength'])
        .where('scheduled_date', '>=', historyStart)
        .where('scheduled_date', '<', weekStart),
    ])

    const makeDays = (fn: (i: number) => { isBox: boolean; isRest: boolean; types: string[] }) =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStartDate)
        d.setUTCDate(d.getUTCDate() + i)
        return { date: d.toISOString().split('T')[0], ...fn(i) }
      })

    if (boxRows.length === 0 && activityRows.length === 0) {
      return { days: makeDays(() => ({ isBox: false, isRest: true, types: [] })), weeks_analyzed: 0 }
    }

    // pg peut renvoyer les colonnes date en objets Date ou en chaînes 'YYYY-MM-DD'
    const toDateStr = (value: string | Date) => (typeof value === 'string' ? value.slice(0, 10) : new Date(value).toISOString().slice(0, 10))
    const dowOf = (dateStr: string) => (new Date(dateStr + 'T00:00:00Z').getUTCDay() + 6) % 7 // 0=Monday
    const mondayOf = (dateStr: string) => {
      const d = new Date(dateStr + 'T00:00:00Z')
      d.setUTCDate(d.getUTCDate() - dowOf(dateStr))
      return d.toISOString().split('T')[0]
    }

    const distinctWeeks = new Set<string>()
    // Par jour de semaine : semaines (lundi) où un jour Box a eu lieu
    const boxWeeksByWeekday: Record<number, Set<string>> = {}
    // Par jour de semaine puis type d'activité : semaines où ce type a été planifié
    const activityWeeksByWeekday: Record<number, Record<string, Set<string>>> = {}
    for (let i = 0; i < 7; i++) {
      boxWeeksByWeekday[i] = new Set()
      activityWeeksByWeekday[i] = {}
    }

    for (const row of boxRows as { scheduled_date: string | Date }[]) {
      const dateStr = toDateStr(row.scheduled_date)
      const dow = dowOf(dateStr)
      const monday = mondayOf(dateStr)
      boxWeeksByWeekday[dow].add(monday)
      distinctWeeks.add(monday)
    }

    for (const row of activityRows as { scheduled_date: string | Date; activity_type: string }[]) {
      const dateStr = toDateStr(row.scheduled_date)
      const dow = dowOf(dateStr)
      const monday = mondayOf(dateStr)
      if (!activityWeeksByWeekday[dow][row.activity_type]) {
        activityWeeksByWeekday[dow][row.activity_type] = new Set()
      }
      activityWeeksByWeekday[dow][row.activity_type].add(monday)
      distinctWeeks.add(monday)
    }

    const weeksAnalyzed = distinctWeeks.size
    // Un type est suggéré s'il est revenu au moins une semaine sur deux
    const majorityThreshold = Math.max(1, Math.ceil(weeksAnalyzed / 2))
    const activityTypeToDayType: Record<string, string> = { wod: 'wod', conditioning: 'conditioning', mobility: 'mobility', strength: 'force' }

    return {
      days: makeDays((i) => {
        const isBox = boxWeeksByWeekday[i].size >= majorityThreshold
        if (isBox) return { isBox: true, isRest: false, types: [] }

        const types = Object.entries(activityWeeksByWeekday[i])
          .filter(([, weeks]) => weeks.size >= majorityThreshold)
          .map(([activityType]) => activityTypeToDayType[activityType])

        return { isBox: false, isRest: types.length === 0, types }
      }),
      weeks_analyzed: weeksAnalyzed,
    }
  }
}
