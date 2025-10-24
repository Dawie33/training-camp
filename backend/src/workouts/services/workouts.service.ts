import { Injectable } from '@nestjs/common'
import { format } from 'date-fns'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { WorkoutDto, WorkoutQueryDto } from '../dto/workout.dto'

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectModel() private readonly knex: Knex
  ) { }

  /**
   * Recherche tous les workouts.
   * @returns Tous les workouts.
   */
  async findAll({ limit = '20', offset = '0', orderBy = 'created_at', orderDir = 'desc', sport_id, search }: WorkoutQueryDto) {
    try {

      let query = this.knex('workouts').select('*')

      if (sport_id) {
        query = query.where('sport_id', sport_id)
      }

      if (search) {
        query = query.where('name', 'ilike', `%${search}%`)
      }

      const rows = await query
        .select('*')
        .where({ status: 'published' })
        .limit(Number(limit))
        .offset(Number(offset))
        .orderBy(orderBy, orderDir)

      const countQuery = this.knex('workouts').count({ count: '*' })

      if (sport_id) {
        countQuery.where('sport_id', sport_id)
      }
      if (search) {
        countQuery.where('name', 'ilike', `%${search}%`)
      }

      const countResult = await countQuery.first()
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
  async getDailyWorkoutBySport(sportId: string, date?: string): Promise<WorkoutDto> {
    const targetDate = date && date.trim() !== '' ? date : format(new Date(), 'yyyy-MM-dd')

    // Récupérer tous les workouts publiés pour ce sport
    const workouts = await this.knex('workouts')
      .where({ sport_id: sportId, status: 'published' })
      .orderBy('id', 'asc') // Ordre stable

    if (!workouts || workouts.length === 0) {
      throw new Error('Aucun workout publié pour ce sport')
    }

    // Utiliser la date comme seed pour sélectionner toujours le même workout pour une date donnée
    // Convertir la date en nombre pour créer un index
    const dateHash = targetDate.split('-').join('') // "2025-10-15" -> "20251015"
    const index = parseInt(dateHash) % workouts.length
    const workout = workouts[index]

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

  /**
   * Récupère les workouts benchmark pour un sport donné
   * Les benchmarks sont des workouts de référence pour évaluer le niveau
   * @param sportId ID du sport
   * @returns Liste des workouts benchmark triés par difficulté
   */
  async getBenchmarkWorkouts(sportId: string) {
    try {
      const rows = await this.knex('workouts')
        .select('*')
        .where({ sport_id: sportId, status: 'published', is_benchmark: true })
        .orderBy('difficulty', 'asc')
        .orderBy('name', 'asc')

      const count = rows.length

      return { rows, count }
    } catch (error) {
      throw new Error('Erreur dans la récupération des benchmarks: ' + error.message)
    }
  }

}