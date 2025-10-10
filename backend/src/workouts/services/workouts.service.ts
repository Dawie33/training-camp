import { Injectable } from '@nestjs/common'
import { format } from 'date-fns'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { WorkoutQueryDto } from '../dto/workout.dto'

@Injectable()
export class WorkoutService {
  constructor(@InjectModel() private readonly knex: Knex) { }

  /**
   * Recherche tous les workouts.
   * @returns Tous les workouts.
   */
  async findAll({ limit = '20', offset = '0', orderBy = 'created_at', orderDir = 'desc' }: WorkoutQueryDto) {
    try {
      const rows = await this.knex('workouts')
        .select('*')
        .where({ status: 'published' })
        .limit(Number(limit))
        .offset(Number(offset))
        .orderBy(orderBy, orderDir)


      const countResult = await this.knex("workouts").where({ status: 'published' }).count({ count: "*" }).first()
      const count = Number(countResult?.count)
      return { rows, count }

    } catch (error) {
      throw new Error('Failed to retrieve workouts: ' + error.message)
    }
  }

  /**
 * Récupère un workout par son ID
 * @param id ID du workout
 * @returns Le workout
 */
  async getWorkoutById(id: string) {
    const workout = await this.knex('workouts')
      .where({ id })
      .first()

    if (!workout) {
      return null
    }

    // Si c'est un workout avec blocks (format daily WOD)
    if (workout.blocks) {
      const { blocks, tags, ...rest } = workout
      return {
        ...rest,
        blocks,
        tags: tags || [],
      }
    }

    // Sinon, c'est un workout bibliothèque avec structure
    return workout
  }





  /**
   * Récupère le workout du jour pour un sport donné.
   * Si un workout est déjà planifié pour cette date, le retourne.
   * Sinon, sélectionne un workout aléatoire de la bibliothèque et le planifie pour ce jour.
   * @param sportId ID du sport
   * @param date Date (format YYYY-MM-DD), par défaut aujourd'hui
   * @returns Le workout du jour
   */
  async getDailyWorkoutBySport(sportId: string, date?: string): Promise<any> {
    // Obtenir la date locale au format YYYY-MM-DD
    const targetDate = date && date.trim() !== '' ? date : format(new Date(), 'yyyy-MM-dd')

    // Vérifier si un workout est déjà planifié pour cette date
    let workout = await this.knex('workouts')
      .where({ sport_id: sportId, scheduled_date: targetDate, status: 'published' })
      .first()

    // Si aucun workout planifié, en sélectionner un aléatoirement
    if (!workout) {
      // Récupérer un workout aléatoire de la bibliothèque (workouts publiés sans date planifiée)
      const randomWorkout = await this.knex('workouts')
        .where({ sport_id: sportId, status: 'published' })
        .whereNull('scheduled_date')
        .orderByRaw('RANDOM()')
        .first()


      if (randomWorkout) {
        // Dupliquer le workout et le planifier pour aujourd'hui
        const [newWorkout] = await this.knex('workouts')
          .insert({
            name: randomWorkout.name,
            slug: randomWorkout.slug ? `${randomWorkout.slug}-${targetDate}` : null,
            description: randomWorkout.description,
            workout_type: randomWorkout.workout_type,
            sport_id: randomWorkout.sport_id,
            blocks: typeof randomWorkout.blocks === 'string' ? randomWorkout.blocks : JSON.stringify(randomWorkout.blocks),
            estimated_duration: randomWorkout.estimated_duration,
            intensity: randomWorkout.intensity,
            difficulty: randomWorkout.difficulty,
            scaling_options: typeof randomWorkout.scaling_options === 'string' ? randomWorkout.scaling_options : JSON.stringify(randomWorkout.scaling_options),
            equipment_required: typeof randomWorkout.equipment_required === 'string' ? randomWorkout.equipment_required : JSON.stringify(randomWorkout.equipment_required),
            focus_areas: typeof randomWorkout.focus_areas === 'string' ? randomWorkout.focus_areas : JSON.stringify(randomWorkout.focus_areas),
            metrics_tracked: typeof randomWorkout.metrics_tracked === 'string' ? randomWorkout.metrics_tracked : JSON.stringify(randomWorkout.metrics_tracked),
            ai_generated: randomWorkout.ai_generated,
            target_metrics: typeof randomWorkout.target_metrics === 'string' ? randomWorkout.target_metrics : JSON.stringify(randomWorkout.target_metrics),
            tags: typeof randomWorkout.tags === 'string' ? randomWorkout.tags : JSON.stringify(randomWorkout.tags),
            scheduled_date: targetDate,
            status: 'published',
            isActive: true,
            isFeatured: false,
            isPublic: true,
            is_benchmark: randomWorkout.is_benchmark,
          })
          .returning('*')

        workout = newWorkout
      } else {
        workout = await this.knex('workouts')
          .where({ sport_id: sportId, status: 'published' })
          .whereNotNull('scheduled_date')
          .orderBy('scheduled_date', 'asc')
          .first()
      }
    }

    if (!workout) {
      return null
    }

    // Retourner le workout avec blocks
    const { blocks, tags, ...rest } = workout
    return {
      ...rest,
      blocks,
      tags: tags || [],
    }
  }


}