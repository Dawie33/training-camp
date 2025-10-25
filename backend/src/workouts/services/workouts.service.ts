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

  async getPersonalizedWorkouts(
    userId: string,
    limit = '20',
    offset = '0',
    search?: string,
    difficulty?: string,
    intensity?: string,
    minDuration?: string,
    maxDuration?: string
  ) {
    let query = this.knex('personalized_workouts')
      .select('*')
      .where({ user_id: userId })

    // Filtre de recherche dans le plan_json (name ou description)
    if (search) {
      query = query.where(function () {
        this.whereRaw(`plan_json->>'name' ILIKE ?`, [`%${search}%`])
          .orWhereRaw(`plan_json->>'description' ILIKE ?`, [`%${search}%`])
      })
    }

    // Filtre de difficulté
    if (difficulty) {
      query = query.whereRaw(`LOWER(plan_json->>'difficulty') = ?`, [difficulty.toLowerCase()])
    }

    // Filtre d'intensité
    if (intensity) {
      query = query.whereRaw(`LOWER(plan_json->>'intensity') = ?`, [intensity.toLowerCase()])
    }

    // Filtre de durée minimale
    if (minDuration) {
      query = query.whereRaw(`plan_json->>'duration' >= ?`, [minDuration])
    }

    // Filtre de durée maximale
    if (maxDuration) {
      query = query.whereRaw(`plan_json->>'duration' <= ?`, [maxDuration])
    }

    const rows = await query
      .limit(Number(limit))
      .offset(Number(offset))
      .orderBy('created_at', 'desc')

    // Count avec les mêmes filtres
    let countQuery = this.knex('personalized_workouts')
      .count({ count: '*' })
      .where({ user_id: userId })

    if (search) {
      countQuery = countQuery.where(function () {
        this.whereRaw(`plan_json->>'name' ILIKE ?`, [`%${search}%`])
          .orWhereRaw(`plan_json->>'description' ILIKE ?`, [`%${search}%`])
      })
    }

    if (difficulty) {
      countQuery = countQuery.whereRaw(`LOWER(plan_json->>'difficulty') = ?`, [difficulty.toLowerCase()])
    }

    if (intensity) {
      countQuery = countQuery.whereRaw(`LOWER(plan_json->>'intensity') = ?`, [intensity.toLowerCase()])
    }

    if (minDuration) {
      countQuery = countQuery.whereRaw(`plan_json->>'duration' >= ?`, [minDuration])
    }

    if (maxDuration) {
      countQuery = countQuery.whereRaw(`plan_json->>'duration' <= ?`, [maxDuration])
    }

    const countResult = await countQuery.first()
    const count = Number(countResult?.count)

    return { rows, count }
  }


  /**
   * Crée un nouveau workout personnalisé.
   * Vérifie si le workout existe avant de le créer.
   * Les données sont transmises via le body de la requête.
   * @param workout Données du workout à créer.
   * @param userId ID de l'utilisateur.
   * @returns Promesse contenant le workout créé.
   * @throws {Error} Si le workout n'existe pas ou si une erreur se produit lors de la création.
   */
  async createPersonalizedWorkout(workout: WorkoutDto, userId: string) {

    // Vérifier si le workout existe
    const baseWorkout = await this.knex('workouts').where({ id: workout.id }).first()

    if (!baseWorkout) {
      throw new Error(`Base workout with id ${workout.id} does not exist`)
    }

    const record = {
      user_id: userId,
      base_id: workout.id,
      plan_json: JSON.stringify(workout),
      wod_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
      params_json: JSON.stringify({}), // Objet vide par défaut
    }

    try {
      const newWorkout = await this.knex('personalized_workouts').insert(record).returning('*')
      return newWorkout[0]
    } catch (error) {
      throw new Error('Failed to create personalized workout: ' + error.message)
    }
  }

  /**
   * Récupère un workout personnalisé par son ID et l'ID de l'utilisateur
   * @param id ID du workout personnalisé
   * @param userId ID de l'utilisateur
   * @returns Le workout personnalisé associé
   * @throws {Error} Si le workout n'est pas trouvé ou que l'utilisateur n'a pas les permissions nécessaires
   */
  async getPersonalizedWorkout(id: string, userId: string) {
    try {
      const workout = await this.knex('personalized_workouts')
        .where({ id, user_id: userId })
        .first()

      if (!workout) {
        throw new Error('Personalized workout not found or you do not have permission to access it')
      }

      return workout
    } catch (error) {
      throw new Error('Failed to fetch personalized workout: ' + error.message)
    }
  }

}