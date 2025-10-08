// src/workouts/workout-ai.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { OpenAI } from 'openai'
import { WorkoutQueryDto } from 'src/workouts/dto/workout.dto'
import { UpdateWorkoutDto } from '../../workouts/dto/workout.dto'
import { DailyPlan, SportRef, SportSlug, WorkoutBlocks } from '../../workouts/types/workout.types'
import { buildSystemPromptForSport, exampleSchemaForSport } from '../constants/prompts'
import { DailyPlanSchema } from '../constants/schemas'

@Injectable()
export class AdminWorkoutService {
    private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    constructor(@InjectModel() private readonly knex: Knex) { }

    async findAll({ limit = '20', offset = '0', search = '', status = '', scheduled_date }: WorkoutQueryDto
    ) {
        let query = this.knex('workouts')
            .select('workouts.*', 'sports.name as sport_name')
            .leftJoin('sports', 'workouts.sport_id', 'sports.id')

        if (search) {
            query = query.where('workouts.name', 'ilike', `%${search}%`)
        }

        if (status) {
            query = query.where('workouts.status', status)
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
            schedule_date: string
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
        if (data.scheduled_date !== undefined) updateData.schedule_date = data.scheduled_date
        const [row] = await this.knex('workouts')
            .where({ id })
            .update(updateData)
            .returning('*')

        return row
    }

    async delete(id: string) {
        await this.knex('workouts').where({ id }).delete()
        return { success: true }
    }


    /**
     * Génération journalière par sport.
     * @param date ISO (yyyy-mm-dd)
     * @param sport {id, slug}
     */
    async generateDaily(
        date: string,
        sport: SportRef,
        seed?: Partial<WorkoutBlocks>,
        tags: string[] = [],
    ): Promise<DailyPlan> {
        const system = buildSystemPromptForSport(sport.slug as SportSlug, date, seed?.availableEquipment)
        const schema = exampleSchemaForSport(sport.slug as SportSlug)

        const user = `date: ${date}
    sportId: ${sport.id}
    sportSlug: ${sport.slug}
    tags globaux: ${JSON.stringify(tags)}
    seed: ${JSON.stringify(seed ?? {})}`

        const res = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 800,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: `Schéma à respecter: ${schema}` },
                { role: 'user', content: user },
            ],
        })

        const raw = res.choices[0]?.message?.content ?? '{}'
        let day: DailyPlan

        try {
            day = DailyPlanSchema.parse(JSON.parse(raw))
        } catch (err) {
            throw new Error(`IA: JSON invalide (parse) - ${err} - RAW: ${raw}`)
        }

        if (!day || !day.date || !day.blocks) {
            throw new Error('IA: JSON invalide (séance journalière)')
        }
        return { ...day, sportId: sport.id }
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
