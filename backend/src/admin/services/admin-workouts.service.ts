import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { CreateWorkoutDto, WorkoutQueryDto } from 'src/workouts/dto/workout.dto'
import { UpdateWorkoutDto } from '../../workouts/dto/workout.dto'

@Injectable()
export class AdminWorkoutService {
    constructor(@InjectModel() private readonly knex: Knex) { }

    /**
* Récupérer une liste paginée d'entraînements avec filtrage et tri facultatifs.
*
* @param {WorkoutQueryDto} query - Paramètres de la requête.
* @param {string} query.limit - Nombre d'entraînements à récupérer. Par défaut: 20.
* @param {string} query.offset - Décalage de pagination. Par défaut: 0.
* @param {string} query.search - Terme de recherche pour le nom de l'entraînement. Facultatif.
* @param {string} query.status - Statut de l'entraînement. Facultatif.
* @param {string} query.scheduled_date - Date prévue de l'entraînement. Facultatif.
* @param {string} query.sport_id - ID du sport auquel appartient l'entraînement. Facultatif.
* @returns {Promise<{rows: Workout[], count: number}>} - Promesse qui renvoie un objet contenant les lignes et le nombre.
     * */
    async findAll({ limit = '20', offset = '0', search = '', status = '', scheduled_date, sport_id }: WorkoutQueryDto
    ) {
        let query = this.knex('workouts').select('*')

        if (search) {
            query = query.where('workouts.name', 'ilike', `%${search}%`)
        }

        if (status) {
            query = query.where('workouts.status', status)
        }

        if (scheduled_date) {
            query = query.where('workouts.scheduled_date', scheduled_date)
        }

        if (sport_id) {
            query = query.where('workouts.sport_id', sport_id)
        }

        const rows = await query
            .limit(Number(limit))
            .offset(Number(offset))
            .orderBy('workouts.created_at', 'desc')

        const countQuery = this.knex('workouts').count('* as count')

        if (search) {
            countQuery.where('name', 'ilike', `%${search}%`)
        }
        if (status) {
            countQuery.where('status', status)
        }

        if (scheduled_date) {
            countQuery.where('scheduled_date', scheduled_date)
        }

        if (sport_id) {
            countQuery.where('sport_id', sport_id)
        }

        const countResult = await countQuery.first()

        return {
            rows,
            count: Number(countResult?.count || 0),
        }
    }

    /**
     * Récupère un workout par son ID
     * @param id ID du workout
     * @returns Le workout avec ses exercices associés
     */
    async findOne(id: string) {
        const workout = await this.knex('workouts')
            .select('workouts.*', 'sports.name as sport_name')
            .leftJoin('sports', 'workouts.sport_id', 'sports.id')
            .where('workouts.id', id)
            .first()

        if (!workout) return null

        // Récupérer les exercices associés
        const exercises = await this.knex('workout_exercises')
            .select('workout_exercises.*', 'exercises.name as exercise_name', 'exercises.category')
            .join('exercises', 'workout_exercises.exercise_id', 'exercises.id')
            .where('workout_exercises.workout_id', id)
            .orderBy('workout_exercises.order_index', 'asc')

        return {
            ...workout,
            exercises,
        }
    }

    /**
     * Récupère les exercices associés à un workout.
     * @param id ID du workout
     * @returns Les exercices associés au workout
     */
    async getWorkoutExercises(id: string) {
        return this.knex('workout_exercises')
            .select('workout_exercises.*', 'exercises.name as exercise_name', 'exercises.category')
            .join('exercises', 'workout_exercises.exercise_id', 'exercises.id')
            .where('workout_exercises.workout_id', id)
            .orderBy('workout_exercises.order_index', 'asc')
    }

    /**
     * Met à jour un workout.
     * @param id ID du workout à mettre à jour.
     * @param data Informations de mise à jour du workout.
     * @returns Le workout mis à jour.
     */
    async update(id: string, data: UpdateWorkoutDto) {

        const updateData: Partial<{
            name: string
            slug: string
            description: string
            workout_type: string
            difficulty: string
            intensity: string
            estimated_duration: string
            status: string
            isActive: boolean
            isFeatured: boolean
            isPublic: boolean
            blocks: string
            tags: string
            scheduled_date: string
        }> = {}


        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.workout_type !== undefined) updateData.workout_type = data.workout_type
        if (data.difficulty !== undefined) updateData.difficulty = data.difficulty
        if (data.intensity !== undefined) updateData.intensity = data.intensity
        if (data.estimated_duration !== undefined) updateData.estimated_duration = data.estimated_duration
        if (data.status !== undefined) updateData.status = data.status
        if (data.isActive !== undefined) updateData.isActive = data.isActive
        if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured
        if (data.isPublic !== undefined) updateData.isPublic = data.isPublic
        if (data.blocks !== undefined) updateData.blocks = JSON.stringify(data.blocks)
        if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
        if (data.scheduled_date !== undefined) updateData.scheduled_date = data.scheduled_date
        const [row] = await this.knex('workouts')
            .where({ id })
            .update(updateData)
            .returning('*')

        return row
    }

    /**
     * Crée un nouveau workout
     * @param data Informations de création du workout
     * @returns Le workout créé
     */
    async create(data: CreateWorkoutDto) {
        // Ensure sport_id is provided
        if (!data.sport_id) {
            throw new Error('sport_id is required')
        }

        // Helper function to safely stringify JSON fields
        const safeJsonStringify = (value: any, defaultValue: any = null) => {
            if (value === undefined || value === null || value === '') {
                return defaultValue === null ? null : JSON.stringify(defaultValue)
            }
            if (typeof value === 'string') {
                return value
            }
            if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    return value.length > 0 ? JSON.stringify(value) : JSON.stringify([])
                }
                return Object.keys(value).length > 0 ? JSON.stringify(value) : JSON.stringify({})
            }
            return JSON.stringify(value)
        }

        // Build the record with proper JSON handling
        const record: any = {
            name: data.name || null,
            slug: data.slug || null,
            description: data.description || null,
            workout_type: data.workout_type || null,
            sport_id: data.sport_id,
            blocks: safeJsonStringify(data.blocks, {}),
            estimated_duration: data.estimated_duration || null,
            intensity: data.intensity || null,
            difficulty: data.difficulty || null,
            scaling_options: safeJsonStringify(data.scaling_options, null),
            equipment_required: safeJsonStringify(data.equipment_required, null),
            focus_areas: safeJsonStringify(data.focus_areas, null),
            metrics_tracked: safeJsonStringify(data.metrics_tracked, null),
            ai_generated: data.ai_generated || false,
            ai_parameters: safeJsonStringify(data.ai_parameters, null),
            created_by_user_id: data.created_by_user_id || null,
            target_metrics: safeJsonStringify(data.target_metrics, null),
            isActive: data.isActive !== undefined ? data.isActive : true,
            isFeatured: data.isFeatured || false,
            isPublic: data.isPublic !== undefined ? data.isPublic : true,
            status: data.status || 'draft',
            scheduled_date: data.scheduled_date || null,
            is_benchmark: data.is_benchmark || false,
            coach_notes: data.coach_notes || null,
            tags: safeJsonStringify(data.tags, []),
        }

        // Insert the workout
        const [row] = await this.knex('workouts')
            .insert(record)
            .returning('*')

        return row
    }

    async delete(id: string) {
        await this.knex('workouts').where({ id }).delete()
        return { success: true }
    }



}
