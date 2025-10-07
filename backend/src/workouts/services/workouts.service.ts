import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { BasesWorkoutDto, QueryDto } from '../dto/workout.dto'
import { WorkoutBlocks } from '../types/workout.types'


@Injectable()
export class WorkoutService {
  constructor(@InjectModel() private readonly knex: Knex) { }

  /**
   * Retrieves all workouts from the database.
   * @returns An array of all workouts.
   */
  async findAll({ limit = '20', offset = '0', orderBy = 'created_at', orderDir = 'desc' }: QueryDto) {
    try {
      const rows = await this.knex('workouts')
        .select('*')
        .limit(Number(limit))
        .offset(Number(offset))
        .orderBy(orderBy, orderDir)


      const count = await this.knex("users").count({ count: "*" })

      return { rows, count }
    } catch (error) {
      throw new Error('Failed to retrieve workouts: ' + error.message)
    }
  }

  /**
   * Inserts a new daily workout record into the database.
   * @param day { date, sportId, tags, blocks }
   * @param status 
   * @param createdBy 
   * @returns 
   */
  async insertBaseDaily(
    day: { date: string; sportId: string; tags: string[]; blocks: WorkoutBlocks },
  ) {
    const record = {
      wod_date: day.date,
      status: 'draft',
      blocks_json: JSON.stringify(day.blocks),
      tags_json: JSON.stringify(day.tags ?? []),
      sport_id: day.sportId,
      created_by: null, // Génération automatique, pas d'utilisateur spécifique
    }

    const [row] = await this.knex('workout_bases')
      .insert(record)
      .onConflict(['wod_date', 'sport_id'])
      .merge({
        blocks_json: record.blocks_json,
        tags_json: record.tags_json,
        status: record.status,
        updated_at: this.knex.fn.now(),
      })
      .returning('*')

    return row
  }

  /**
   * Récupère le workout du jour pour un sport donné
   * @param sportId ID du sport
   * @param date Date (format YYYY-MM-DD), par défaut aujourd'hui
   * @returns Le workout du jour publié pour ce sport
   */
  async getDailyWorkoutBySport(sportId: string, date?: string) {
    console.log('🔍 getDailyWorkoutBySport called with:', { sportId, date, dateType: typeof date })

    const query = this.knex('workout_bases').where({ sport_id: sportId, status: 'published' })
    let workout: BasesWorkoutDto
    // Ajouter la condition de date
    if (date && date.trim() !== '') {
      query.where('wod_date', '=', date)
      workout = await query.first()
    } else {
      // Récupérer le dernier workout créé pour ce sport
      workout = await query.orderBy('created_at', 'desc').first()
    }

    if (!workout) {
      return null
    }

    // Extraire blocks_json et tags_json, retourner le reste + blocks et tags
    const { blocks_json, tags_json, ...rest } = workout
    return {
      ...rest,
      blocks: blocks_json,
      tags: tags_json,
    }
  }


}