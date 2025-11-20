import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { CreateScheduleDto, ScheduleQueryDto, UpdateScheduleDto } from '../dto/schedule.dto'

@Injectable()
export class WorkoutScheduleService {
  constructor(
    @InjectModel() private readonly knex: Knex
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
        'workouts.name as workout_name',
        'workouts.workout_type',
        'workouts.difficulty',
        'workouts.intensity',
        'workouts.estimated_duration',
        'workouts.sport_id',
        'sports.name as sport_name'
      )
      .leftJoin('workouts', 'user_workout_schedule.workout_id', 'workouts.id')
      .leftJoin('sports', 'workouts.sport_id', 'sports.id')
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
        'workouts.name as workout_name',
        'workouts.workout_type',
        'workouts.difficulty',
        'workouts.intensity',
        'workouts.estimated_duration',
        'workouts.sport_id',
        'sports.name as sport_name'
      )
      .leftJoin('workouts', 'user_workout_schedule.workout_id', 'workouts.id')
      .leftJoin('sports', 'workouts.sport_id', 'sports.id')
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
        'workouts.name as workout_name',
        'workouts.workout_type',
        'workouts.difficulty',
        'workouts.intensity',
        'workouts.estimated_duration',
        'workouts.sport_id',
        'sports.name as sport_name'
      )
      .leftJoin('workouts', 'user_workout_schedule.workout_id', 'workouts.id')
      .leftJoin('sports', 'workouts.sport_id', 'sports.id')
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
    // Vérifier si le workout existe
    const workout = await this.knex('workouts').where('id', data.workout_id).first()
    if (!workout) {
      throw new NotFoundException('Workout non trouvé')
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
        workout_id: data.workout_id,
        scheduled_date: data.scheduled_date,
        notes: data.notes || null,
        status: 'scheduled',
      })
      .returning('*')

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
