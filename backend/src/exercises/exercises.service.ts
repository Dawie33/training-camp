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
     * Récupère un exercice par son identifiant.
     * @param {string} id - Identifiant de l'exercice.
     * @returns {Promise<Exercise | null>} - Promesse qui renvoie l'exercice correspondant à l'identifiant ou null si l'exercice n'existe pas.
     */
    async findOne(id: string) {
        return this.knex('exercises').where({ id }).first()
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

    /**
     * @param unlockedNames Noms de mouvements a autoriser meme au-dela du niveau
     * declare (sport_level) : signal concret de maitrise (1RM enregistre, skill
     * termine...). Compare par correspondance floue (insensible a la casse,
     * espaces/tirets ignores) plutot qu'une egalite stricte, car le nom d'une
     * competence ("Muscle-Up") ne correspond pas toujours exactement au nom de
     * l'exercice en base ("Ring Muscle-Up").
     */
    async findForProgram({
        difficulty,
        equipment = [],
        categories,
        unlockedNames = [],
    }: {
        difficulty?: string
        equipment?: string[]
        categories?: string[]
        unlockedNames?: string[]
    }) {
        let query = this.knex('exercises').where('isActive', true)

        if (categories && categories.length > 0) {
            query = query.whereIn('category', categories)
        }

        if (equipment.length > 0) {
            query = query.whereRaw(
                `NOT EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements_text(COALESCE(equipment_required::jsonb, '[]'::jsonb)) AS required_equipment(value)
                    WHERE NOT (required_equipment.value = ANY(?::text[]))
                )`,
                [equipment],
            )
        } else {
            query = query.whereRaw(`COALESCE(equipment_required::jsonb, '[]'::jsonb) = '[]'::jsonb`)
        }

        const rows: Array<{ name: string; category: string; difficulty: string;[key: string]: unknown }> = await query.orderBy('name', 'asc')

        if (!difficulty) {
            return rows
        }

        const allowedDifficulties = new Set(this.allowedDifficulties(difficulty))
        const unlockedPatterns = unlockedNames.map((name) => this.normalizeMovementName(name)).filter(Boolean)

        return rows.filter((row) => {
            if (allowedDifficulties.has(row.difficulty)) return true
            if (unlockedPatterns.length === 0) return false
            const normalizedName = this.normalizeMovementName(row.name)
            return unlockedPatterns.some((pattern) => normalizedName.includes(pattern) || pattern.includes(normalizedName))
        })
    }

    private allowedDifficulties(difficulty: string): string[] {
        const levels = ['beginner', 'intermediate', 'advanced']
        const index = levels.indexOf(difficulty)
        return index >= 0 ? levels.slice(0, index + 1) : [difficulty]
    }

    private normalizeMovementName(value: string): string {
        return value.toLowerCase().replace(/[-\s]/g, '')
    }
}
