import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { toDateOnly } from 'src/common/utils/date-only'
import { isUniqueViolation } from 'src/common/utils/postgres-errors'
import { GoogleCalendarService } from '../google-calendar/google-calendar.service'
import {
  CreateScheduledActivityDto,
  UnifiedActivityQueryDto,
  UpdateScheduledActivityDto,
} from './dto/scheduled-activity.dto'
import { UnifiedActivity } from './types/unified-activity.type'

const ACTIVITY_LABELS: Record<string, string> = { skill: 'Skill', wod: 'WOD', conditioning: 'Conditioning' }

/** Index unique (user_id, scheduled_date, activity_type) : migration unique_scheduled_activity_per_day */
const UNIQUE_PER_DAY_INDEX = 'scheduled_activities_user_date_type_unique'

const alreadyScheduled = (activityType: string) =>
  new ConflictException(`Une activité ${activityType} est déjà planifiée pour cette date`)

export interface SkillEnrichment {
  title: string
  skill_program_id: string
  skill_name: string
  skill_category: string
  skill_step_title?: string
  skill_progress: number
}

@Injectable()
export class ScheduledActivitiesService {
  constructor(
    @InjectModel() private readonly knex: Knex,
    private readonly googleCalendarService: GoogleCalendarService
  ) {}

  /**
   * Enrichit un lot de programmes de skill : nom, catégorie, étape en cours et % de progression.
   * Retourne une Map indexée par skill_program_id.
   * Seuls les programmes de `userId` sont lus : un activity_id pointant vers le programme d'un autre
   * utilisateur (donnée ancienne ou modifiée) ne révèle jamais ses informations.
   */
  private async getSkillEnrichment(userId: string, programIds: string[]): Promise<Map<string, SkillEnrichment>> {
    const map = new Map<string, SkillEnrichment>()
    const uniqueIds = [...new Set(programIds.filter(Boolean))]
    if (uniqueIds.length === 0) return map

    const programs = await this.knex('skill_programs').whereIn('id', uniqueIds).where('user_id', userId)
    if (programs.length === 0) return map

    const steps = await this.knex('skill_program_steps')
      .whereIn(
        'program_id',
        programs.map(p => p.id)
      )
      .select('program_id', 'title', 'status')

    const stepsByProgram = new Map<string, Array<{ title: string; status: string }>>()
    for (const s of steps) {
      const list = stepsByProgram.get(s.program_id) ?? []
      list.push({ title: s.title, status: s.status })
      stepsByProgram.set(s.program_id, list)
    }

    for (const p of programs) {
      const programSteps = stepsByProgram.get(p.id) ?? []
      const total = programSteps.length
      const done = programSteps.filter(s => s.status === 'completed' || s.status === 'skipped').length
      const currentStep = programSteps.find(s => s.status === 'in_progress')

      map.set(p.id, {
        title: p.skill_name,
        skill_program_id: p.id,
        skill_name: p.skill_name,
        skill_category: p.skill_category,
        skill_step_title: currentStep?.title,
        skill_progress: total > 0 ? Math.round((done / total) * 100) : 0,
      })
    }

    return map
  }

  /**
   * Convertit une ligne de `scheduled_activities` en activité unifiée, enrichie du programme
   * de skill lié s'il y en a un. Seul endroit où cette conversion est faite.
   */
  private toUnifiedActivity(row: Record<string, any>, skill?: SkillEnrichment): UnifiedActivity {
    return {
      id: row.id,
      user_id: row.user_id,
      scheduled_date: toDateOnly(row.scheduled_date),
      module: row.activity_type,
      status: row.status,
      title: skill?.title ?? (ACTIVITY_LABELS[row.activity_type] || row.activity_type),
      notes: row.notes,
      location: row.location,
      created_at: row.created_at,
      updated_at: row.updated_at,
      activity_type: row.activity_type,
      activity_id: row.activity_id,
      ...(skill && {
        skill_program_id: skill.skill_program_id,
        skill_name: skill.skill_name,
        skill_category: skill.skill_category,
        skill_step_title: skill.skill_step_title,
        skill_progress: skill.skill_progress,
      }),
      _source: 'scheduled_activities',
    }
  }

  /** Charge le programme de skill d'une seule ligne (création, mise à jour). */
  private async enrichOne(row: Record<string, any>): Promise<UnifiedActivity> {
    const skill =
      row.activity_type === 'skill' && row.activity_id
        ? (await this.getSkillEnrichment(row.user_id, [row.activity_id])).get(row.activity_id)
        : undefined
    return this.toUnifiedActivity(row, skill)
  }

  /** Vérifie que le programme de skill appartient à l'utilisateur (404 sinon, sans dire qu'il existe). */
  private async assertOwnsSkillProgram(userId: string, programId: string): Promise<void> {
    const program = await this.knex('skill_programs').where('id', programId).where('user_id', userId).first()
    if (!program) {
      throw new NotFoundException('Programme de skill non trouvé')
    }
  }

  /**
   * Exécute une écriture et traduit une violation de l'index unique par jour en 409.
   * La vérification préalable du service reste là pour le cas courant ; l'index couvre
   * les requêtes simultanées (double clic) qui passaient toutes les deux.
   */
  private async rejectDuplicate<T>(activityType: string, write: () => Promise<T>): Promise<T> {
    try {
      return await write()
    } catch (error) {
      if (isUniqueViolation(error, UNIQUE_PER_DAY_INDEX)) throw alreadyScheduled(activityType)
      throw error
    }
  }

  /**
   * Retourne la liste unifiée de toutes les activités planifiées d'un utilisateur
   * (CrossFit depuis user_workout_schedule + nouveaux modules depuis scheduled_activities)
   */
  async findUnified(userId: string, query: UnifiedActivityQueryDto): Promise<UnifiedActivity[]> {
    const { start_date, end_date, status, module: moduleFilter } = query

    const activities: UnifiedActivity[] = []

    // --- CrossFit (user_workout_schedule) ---
    if (!moduleFilter || moduleFilter === 'crossfit') {
      let cfQuery = this.knex('user_workout_schedule')
        .select(
          'user_workout_schedule.*',
          this.knex.raw(`COALESCE(workouts.name, personalized_workouts.plan_json->>'name') as workout_name`),
          this.knex.raw(
            `COALESCE(workouts.workout_type, personalized_workouts.plan_json->>'workout_type') as workout_type`
          ),
          this.knex.raw(`COALESCE(workouts.difficulty, personalized_workouts.plan_json->>'difficulty') as difficulty`),
          this.knex.raw(`COALESCE(workouts.intensity, personalized_workouts.plan_json->>'intensity') as intensity`),
          this.knex.raw(
            `COALESCE(workouts.estimated_duration, CAST(NULLIF(personalized_workouts.plan_json->>'estimated_duration', '') AS INTEGER)) as estimated_duration`
          )
        )
        .leftJoin('workouts', 'user_workout_schedule.workout_id', 'workouts.id')
        .leftJoin('personalized_workouts', 'user_workout_schedule.personalized_workout_id', 'personalized_workouts.id')
        .where('user_workout_schedule.user_id', userId)

      if (start_date) cfQuery = cfQuery.where('user_workout_schedule.scheduled_date', '>=', start_date)
      if (end_date) cfQuery = cfQuery.where('user_workout_schedule.scheduled_date', '<=', end_date)
      if (status) cfQuery = cfQuery.where('user_workout_schedule.status', status)

      const cfRows = await cfQuery.orderBy('user_workout_schedule.scheduled_date', 'asc')

      for (const row of cfRows) {
        const sessionData =
          row.session_data && typeof row.session_data === 'object'
            ? (row.session_data as { title?: string; estimated_duration?: number })
            : null

        let title: string
        if (row.session_type === 'box_session') {
          title = 'Jour Box'
        } else if (row.session_type === 'program_session') {
          title = sessionData?.title || 'Séance programme'
        } else {
          title = row.workout_name || 'Workout'
        }

        activities.push({
          id: row.id,
          user_id: row.user_id,
          scheduled_date: toDateOnly(row.scheduled_date),
          module: 'crossfit',
          status: row.status,
          title,
          notes: row.notes,
          location: row.location,
          created_at: row.created_at,
          updated_at: row.updated_at,
          workout_id: row.workout_id,
          personalized_workout_id: row.personalized_workout_id,
          session_type: row.session_type,
          workout_name: row.workout_name,
          workout_type: row.workout_type,
          difficulty: row.difficulty,
          intensity: row.intensity,
          estimated_duration: row.estimated_duration ?? sessionData?.estimated_duration,
          completed_session_id: row.completed_session_id,
          program_enrollment_id: row.program_enrollment_id,
          session_data: row.session_data,
          _source: 'workout_schedule',
        })
      }
    }

    // --- Nouveaux modules (scheduled_activities) ---
    if (!moduleFilter || moduleFilter !== 'crossfit') {
      let saQuery = this.knex('scheduled_activities').where('user_id', userId)

      if (start_date) saQuery = saQuery.where('scheduled_date', '>=', start_date)
      if (end_date) saQuery = saQuery.where('scheduled_date', '<=', end_date)
      if (status) saQuery = saQuery.where('status', status)
      if (moduleFilter) saQuery = saQuery.where('activity_type', moduleFilter)

      const saRows = await saQuery.orderBy('scheduled_date', 'asc')

      // Batch-fetch les programmes de skill liés pour enrichir les créneaux skill planifiés
      const skillProgramIds = saRows.filter(r => r.activity_type === 'skill' && r.activity_id).map(r => r.activity_id)
      const skillEnrichmentMap = await this.getSkillEnrichment(userId, skillProgramIds)

      for (const row of saRows) {
        const skill =
          row.activity_type === 'skill' && row.activity_id ? skillEnrichmentMap.get(row.activity_id) : undefined
        activities.push(this.toUnifiedActivity(row, skill))
      }
    }

    // Tri global par date
    return activities.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
  }

  /**
   * Crée une nouvelle activité planifiée (nouveaux modules uniquement)
   */
  async create(userId: string, data: CreateScheduledActivityDto): Promise<UnifiedActivity> {
    const existing = await this.knex('scheduled_activities')
      .where('user_id', userId)
      .where('scheduled_date', data.scheduled_date)
      .where('activity_type', data.activity_type)
      .first()

    if (existing) {
      throw alreadyScheduled(data.activity_type)
    }

    if (data.activity_type === 'skill' && data.activity_id) {
      await this.assertOwnsSkillProgram(userId, data.activity_id)
    }

    const [row] = await this.rejectDuplicate(data.activity_type, () =>
      this.knex('scheduled_activities')
        .insert({
          user_id: userId,
          scheduled_date: data.scheduled_date,
          activity_type: data.activity_type,
          activity_id: data.activity_id || null,
          status: 'scheduled',
          location: data.location || null,
          notes: data.notes || null,
        })
        .returning('*')
    )

    // Sync Google Calendar en arrière-plan (silencieux si non connecté)
    this.googleCalendarService
      .syncWorkout(userId, {
        name: ACTIVITY_LABELS[data.activity_type] || data.activity_type,
        scheduledDate: data.scheduled_date,
      })
      .catch(() => undefined)

    return this.enrichOne(row)
  }

  /**
   * Met à jour une activité planifiée (nouveaux modules uniquement)
   */
  async update(id: string, userId: string, data: UpdateScheduledActivityDto): Promise<UnifiedActivity> {
    const existing = await this.knex('scheduled_activities').where('id', id).where('user_id', userId).first()

    if (!existing) {
      throw new NotFoundException('Activité non trouvée')
    }

    // Sans ce contrôle, un PATCH pouvait relier l'activité au programme d'un autre utilisateur
    if (existing.activity_type === 'skill' && data.activity_id && data.activity_id !== existing.activity_id) {
      await this.assertOwnsSkillProgram(userId, data.activity_id)
    }

    // existing.scheduled_date est un objet Date (colonne date) : on compare les jours, pas les types
    if (data.scheduled_date && toDateOnly(data.scheduled_date) !== toDateOnly(existing.scheduled_date)) {
      const conflict = await this.knex('scheduled_activities')
        .where('user_id', userId)
        .where('scheduled_date', data.scheduled_date)
        .where('activity_type', existing.activity_type)
        .whereNot('id', id)
        .first()

      if (conflict) {
        throw alreadyScheduled(existing.activity_type)
      }
    }

    const [row] = await this.rejectDuplicate(existing.activity_type, () =>
      this.knex('scheduled_activities')
        .where('id', id)
        .where('user_id', userId)
        .update({
          scheduled_date: data.scheduled_date ?? existing.scheduled_date,
          status: data.status ?? existing.status,
          activity_id: data.activity_id ?? existing.activity_id,
          location: data.location ?? existing.location,
          notes: data.notes ?? existing.notes,
          updated_at: new Date(),
        })
        .returning('*')
    )

    return this.enrichOne(row)
  }

  /**
   * Supprime une activité planifiée (nouveaux modules uniquement)
   */
  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    const deleted = await this.knex('scheduled_activities').where('id', id).where('user_id', userId).delete()

    if (deleted === 0) {
      throw new NotFoundException('Activité non trouvée')
    }

    return { success: true }
  }

  async markAsCompleted(id: string, userId: string): Promise<UnifiedActivity> {
    return this.update(id, userId, { status: 'completed' })
  }

  async markAsSkipped(id: string, userId: string): Promise<UnifiedActivity> {
    return this.update(id, userId, { status: 'skipped' })
  }
}
