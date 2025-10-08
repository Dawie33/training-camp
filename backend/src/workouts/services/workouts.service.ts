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

        const slug = this.slugify(ex.name)

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
      const slug = this.slugify(equipment)
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
   * Crée un slug à partir d'un texte
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
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