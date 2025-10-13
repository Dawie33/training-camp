import { Injectable } from '@nestjs/common'
import { format } from 'date-fns'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { WorkoutQueryDto } from '../dto/workout.dto'

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectModel() private readonly knex: Knex
  ) { }

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
            description: randomWorkout.description || null,
            workout_type: randomWorkout.workout_type,
            sport_id: randomWorkout.sport_id,
            blocks: randomWorkout.blocks ? (typeof randomWorkout.blocks === 'string' ? randomWorkout.blocks : JSON.stringify(randomWorkout.blocks)) : null,
            estimated_duration: randomWorkout.estimated_duration || null,
            intensity: randomWorkout.intensity || null,
            difficulty: randomWorkout.difficulty || null,
            scaling_options: randomWorkout.scaling_options ? (typeof randomWorkout.scaling_options === 'string' ? randomWorkout.scaling_options : JSON.stringify(randomWorkout.scaling_options)) : null,
            equipment_required: randomWorkout.equipment_required ? (typeof randomWorkout.equipment_required === 'string' ? randomWorkout.equipment_required : JSON.stringify(randomWorkout.equipment_required)) : null,
            focus_areas: randomWorkout.focus_areas ? (typeof randomWorkout.focus_areas === 'string' ? randomWorkout.focus_areas : JSON.stringify(randomWorkout.focus_areas)) : null,
            metrics_tracked: randomWorkout.metrics_tracked ? (typeof randomWorkout.metrics_tracked === 'string' ? randomWorkout.metrics_tracked : JSON.stringify(randomWorkout.metrics_tracked)) : null,
            ai_generated: randomWorkout.ai_generated || false,
            target_metrics: randomWorkout.target_metrics ? (typeof randomWorkout.target_metrics === 'string' ? randomWorkout.target_metrics : JSON.stringify(randomWorkout.target_metrics)) : null,
            tags: randomWorkout.tags ? (typeof randomWorkout.tags === 'string' ? randomWorkout.tags : JSON.stringify(randomWorkout.tags)) : null,
            scheduled_date: targetDate,
            status: 'published',
            isActive: true,
            isFeatured: false,
            isPublic: true,
            is_benchmark: randomWorkout.is_benchmark || false,
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

  /**
   * Récupère les workouts recommandés pour un utilisateur
   * Basé sur le sport actif, le niveau et les équipements disponibles
   * @param userId ID de l'utilisateur
   * @param sportId ID du sport actif
   * @param limit Nombre de workouts à retourner
   * @returns Liste paginée de workouts recommandés
   */
  async getRecommendedWorkouts(userId: string, sportId: string, limit: number = 4) {
    try {
      // 1. Récupérer le profil sportif spécifique de l'utilisateur
      const userSportProfile = await this.knex('user_sport_profiles')
        .where({ user_id: userId, sport_id: sportId })
        .first()

      // 2. Construire la requête de base
      const query = this.knex('workouts')
        .select('*')
        .where({ sport_id: sportId, status: 'published' })
        .limit(Number(limit))
        .orderBy('created_at', 'desc')

      // 3. Filtrer par niveau spécifique au sport si disponible
      if (userSportProfile?.sport_level) {
        query.where('difficulty', userSportProfile.sport_level)
      }

      // 4. Exécuter la requête
      const rows = await query

      // 5. Compter le total
      const countQuery = this.knex('workouts')
        .where({ sport_id: sportId, status: 'published' })
        .count({ count: '*' })

      if (userSportProfile?.sport_level) {
        countQuery.where('difficulty', userSportProfile.sport_level)
      }

      const countResult = await countQuery.first()
      const count = Number(countResult?.count || 0)

      return { rows, count }
    } catch (error) {
      throw new Error('Failed to retrieve recommended workouts: ' + error.message)
    }
  }


}