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
    if (!data.workout_id && !data.personalized_workout_id) {
      throw new BadRequestException('workout_id ou personalized_workout_id est requis')
    }

    let workoutName = 'Workout'
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
    } else {
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
}
