import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { slugify } from 'src/common/utils/utils'
import { WorkoutQueryDto } from 'src/workouts/dto/workout.dto'
import { UpdateWorkoutDto } from '../../workouts/dto/workout.dto'
import { WorkoutBlocks } from '../../workouts/types/workout.types'

@Injectable()
export class AdminWorkoutService {
    constructor(@InjectModel() private readonly knex: Knex) { }

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

    async getWorkoutExercises(id: string) {
        return this.knex('workout_exercises')
            .select('workout_exercises.*', 'exercises.name as exercise_name', 'exercises.category')
            .join('exercises', 'workout_exercises.exercise_id', 'exercises.id')
            .where('workout_exercises.workout_id', id)
            .orderBy('workout_exercises.order_index', 'asc')
    }

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

    async create(data: any) {
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
        const trx = await this.knex.transaction()

        try {
            // Properly handle JSON fields - ensure they are never empty strings
            const blocksValue = workout.blocks && Object.keys(workout.blocks).length > 0
                ? (typeof workout.blocks === 'string' ? workout.blocks : JSON.stringify(workout.blocks))
                : JSON.stringify({})

            const tagsValue = workout.tags && workout.tags.length > 0
                ? (typeof workout.tags === 'string' ? workout.tags : JSON.stringify(workout.tags))
                : JSON.stringify([])

            const record: any = {
                status: 'draft',
                blocks: blocksValue,
                tags: tagsValue,
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

            // Insérer le workout
            let row: any
            if (workout.date) {
                [row] = await trx('workouts')
                    .insert(record)
                    .onConflict(['scheduled_date', 'sport_id'])
                    .merge({
                        ...record,
                        updated_at: trx.fn.now(),
                    })
                    .returning('*')
            } else {
                [row] = await trx('workouts')
                    .insert(record)
                    .returning('*')
            }

            // Extraire et insérer les exercices et équipements depuis les blocks
            await this.extractAndInsertExercisesAndEquipments(trx, row.id, workout.blocks, workout.difficulty)

            await trx.commit()
            return row
        } catch (error) {
            await trx.rollback()
            throw error
        }
    }

    /**
     * Extrait les exercices et équipements depuis les blocks et les insère dans les tables
     * @param trx Transaction Knex
     * @param workoutId ID du workout
     * @param blocks Blocks du workout
     * @param difficulty Difficulté du workout
     */
    private async extractAndInsertExercisesAndEquipments(
        trx: Knex.Transaction,
        workoutId: string,
        blocks: WorkoutBlocks,
        difficulty?: string,
    ) {
        const blocksData = typeof blocks === 'string' ? JSON.parse(blocks) : blocks
        const equipmentSet = new Set<string>()
        let orderIndex = 0

        // Parcourir tous les blocks (warmup, main, cooldown, etc.)
        for (const [blockType, blockData] of Object.entries(blocksData)) {
            if (!blockData || typeof blockData !== 'object') continue

            const exercises = (blockData as any).exercises || []

            for (const ex of exercises) {
                if (!ex.name) continue

                const slug = slugify(ex.name)

                // 1. Insérer l'exercice s'il n'existe pas déjà
                const [exercise] = await trx('exercises')
                    .insert({
                        name: ex.name,
                        slug,
                        description: ex.description || null,
                        category: ex.category || 'strength',
                        difficulty: difficulty || 'intermediate',
                        measurement_type: ex.measurement_type || 'reps',
                        equipment_required: ex.equipment ? JSON.stringify([ex.equipment]) : null,
                        muscle_groups: ex.muscle_groups ? JSON.stringify(ex.muscle_groups) : null,
                        instructions: ex.instructions || null,
                    })
                    .onConflict('slug')
                    .ignore()
                    .returning('id')

                // Récupérer l'ID si déjà existant
                const exerciseId =
                    exercise?.id || (await trx('exercises').where('slug', slug).first()).id

                // 2. Lier l'exercice au workout dans workout_exercises
                await trx('workout_exercises').insert({
                    workout_id: workoutId,
                    exercise_id: exerciseId,
                    order_index: orderIndex++,
                    sets: ex.sets || null,
                    reps: ex.reps || null,
                    weight: ex.weight || null,
                    distance: ex.distance || null,
                    time: ex.time || ex.duration || null,
                    specific_instructions: ex.notes || null,
                    is_warmup: blockType.toLowerCase().includes('warmup'),
                    is_cooldown: blockType.toLowerCase().includes('cooldown'),
                    is_main_workout: blockType.toLowerCase().includes('main') || blockType.toLowerCase().includes('metcon'),
                })

                // 3. Collecter les équipements
                if (ex.equipment) {
                    if (Array.isArray(ex.equipment)) {
                        ex.equipment.forEach((eq: string) => equipmentSet.add(eq))
                    } else {
                        equipmentSet.add(ex.equipment)
                    }
                }
            }
        }

        // 4. Insérer les équipements dans la table equipments
        for (const equipment of equipmentSet) {
            const slug = slugify(equipment)
            await trx('equipments')
                .insert({
                    slug,
                    label: equipment,
                    meta: JSON.stringify({}),
                })
                .onConflict('slug')
                .ignore()
        }
    }


    /**
     * Publier un workout.
     * - passe le statut à 'published'
     * - (optionnel) empêche les doublons publiés (même date/sport)
     */
    async publishWorkout(id: string) {
        return this.knex.transaction(async (trx) => {
            // On récupère le draft
            const draft = await trx('workouts')
                .where({ id })
                .first()

            if (!draft) throw new NotFoundException('Workout introuvable')
            if (draft.status === 'published') {
                throw new ConflictException('Déjà publié')
            }

            const rows = await trx('workouts')
                .where({ id: draft.id })
                .update({
                    status: 'published',
                    updated_at: trx.fn.now(),
                })
                .returning('*')

            return rows[0]
        })
    }

}
