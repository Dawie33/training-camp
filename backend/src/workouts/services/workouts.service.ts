import { Injectable } from '@nestjs/common'
import { format } from 'date-fns'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { QueryDto } from '../dto/workout.dto'
import { WorkoutBlocks } from '../types/workout.types'


@Injectable()
export class WorkoutService {
  constructor(@InjectModel() private readonly knex: Knex) { }

  /**
   * Recherche tous les workouts.
   * @returns Tous les workouts.
   */
  async findAll({ limit = '20', offset = '0', orderBy = 'created_at', orderDir = 'desc' }: QueryDto) {
    try {
      const rows = await this.knex('workouts')
        .select('*')
        .limit(Number(limit))
        .offset(Number(offset))
        .orderBy(orderBy, orderDir)


      const countResult = await this.knex("workouts").count({ count: "*" }).first()
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
   * Ajoute un nouveau workout.
   * @param workout Données du workout incluant métadonnées
   * @returns
   */
  async insertWorkout(
    workout: {
      date?: string // Optionnel maintenant
      sportId: string
      tags: string[]
      blocks: WorkoutBlocks
      name?: string
      workout_type?: string
      difficulty?: string
      estimated_duration?: number
      intensity?: string
      description?: string
      coach_notes?: string
    },
  ) {
    const record: any = {
      status: 'draft',
      blocks: typeof workout.blocks === 'string' ? workout.blocks : JSON.stringify(workout.blocks),
      tags: typeof workout.tags === 'string' ? workout.tags : JSON.stringify(workout.tags ?? []),
      sport_id: workout.sportId,
      created_by_user_id: null, // Génération automatique, pas d'utilisateur spécifique
      ai_generated: true,
    }

    // Ajouter scheduled_date seulement si fourni
    if (workout.date) {
      record.scheduled_date = workout.date
    }

    // Ajouter les champs optionnels s'ils existent
    if (workout.name) record.name = workout.name
    if (workout.workout_type) record.workout_type = workout.workout_type
    if (workout.difficulty) record.difficulty = workout.difficulty
    if (workout.estimated_duration) record.estimated_duration = workout.estimated_duration
    if (workout.intensity) record.intensity = workout.intensity
    if (workout.description) record.description = workout.description
    if (workout.coach_notes) record.coach_notes = workout.coach_notes

    // Si scheduled_date est fourni, utiliser onConflict pour éviter les doublons
    if (workout.date) {
      const [row] = await this.knex('workouts')
        .insert(record)
        .onConflict(['scheduled_date', 'sport_id'])
        .merge({
          ...record,
          updated_at: this.knex.fn.now(),
        })
        .returning('*')
      return row
    } else {
      // Sinon, insertion simple (workout de bibliothèque)
      const [row] = await this.knex('workouts')
        .insert(record)
        .returning('*')
      return row
    }
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