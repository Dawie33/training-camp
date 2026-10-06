import { Injectable } from "@nestjs/common"
import { Knex } from "knex"
import { InjectModel } from "nest-knexjs"
import { ExerciseQueryDto } from "src/exercises/dto/exercises.dto"

@Injectable()
export class ExercisesService {
    constructor(@InjectModel() private readonly knex: Knex) { }

    /**
     * Récupérer tous les exercices.
     * @param {QueryDto} query - Paramètres de la requête.
     * @param {string} query.limit - Nombre d'exercices à récupérer. Par défaut : 50.
     * @param {string} query.offset - Décalage de pagination. Par défaut : 0.
     * @param {string} query.search - Paramètre de recherche. S'il est défini, la valeur donnée dans l'étiquette de l'exercice sera recherchée.
     * @param {string} query.orderBy - Colonne de tri. Par défaut : « created_at ».
     * @param {string} query.orderDir - Sens de l'ordre. Par défaut : « desc ».
     * @returns {Promise<{rows: Exercise[], count: number}>} - Promesse qui renvoie un objet contenant les lignes et le nombre.
     */
    async findAll({
        limit = '50',
        offset = '0',
        search,
        category,
        difficulty,
        bodyweight_only,
        orderBy = 'created_at',
        orderDir = 'desc'
    }: ExerciseQueryDto) {

        let query = this.knex("exercises").select("*")

        // Recherche par nom
        if (search) {
            query = query.where('name', 'ilike', `%${search}%`)
        }

        // Filtre par catégorie
        if (category) {
            query = query.where('category', category)
        }

        // Filtre par difficulté
        if (difficulty) {
            query = query.where('difficulty', difficulty)
        }

        // Filtre bodyweight only
        if (bodyweight_only !== undefined) {
            query = query.where('bodyweight_only', bodyweight_only)
        }

        const rows = await query
            .limit(Number(limit))
            .offset(Number(offset))
            .orderBy(orderBy, orderDir)

        // Count avec les mêmes filtres
        let countQuery = this.knex("exercises").count({ count: "*" })

        if (search) {
            countQuery = countQuery.where('name', 'ilike', `%${search}%`)
        }
        if (category) {
            countQuery = countQuery.where('category', category)
        }
        if (difficulty) {
            countQuery = countQuery.where('difficulty', difficulty)
        }
        if (bodyweight_only !== undefined) {
            countQuery = countQuery.where('bodyweight_only', bodyweight_only)
        }

        const countResult = await countQuery.first()
        const count = Number(countResult?.count)

        return { rows, count }

    }

    /**
     * Récupère un exercice par son nom.
     * Recherche d'abord une correspondance exacte, sinon recherche avec ILIKE (insensible à la casse et pluriel tolérant)
     * @param {string} name - Nom de l'exercice.
     * @returns {Promise<Exercise | null>} - Promesse qui renvoie l'exercice correspondant au nom ou null si l'exercice n'existe pas.
     */
    async findByName(name: string) {
        // Essayer une correspondance exacte d'abord
        let exercise = await this.knex('exercises').where({ 'name': name }).first()

        if (exercise) {
            return exercise
        }

        // Sinon, recherche insensible à la casse et au pluriel
        // Enlever le 's' final si présent pour supporter "Air Squats" -> "Air Squat"
        const singularName = name.endsWith('s') ? name.slice(0, -1) : name
        exercise = await this.knex('exercises')
            .where('name', 'ilike', singularName)
            .orWhere('name', 'ilike', name)
            .first()

        return exercise || null
    }
}
