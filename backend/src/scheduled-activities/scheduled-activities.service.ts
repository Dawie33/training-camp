import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { GoogleCalendarService } from '../google-calendar/google-calendar.service'
import { CreateScheduledActivityDto, UnifiedActivityQueryDto, UpdateScheduledActivityDto } from './dto/scheduled-activity.dto'
import { UnifiedActivity } from './types/unified-activity.type'

const ACTIVITY_LABELS: Record<string, string> = { running: 'Running', biking: 'Vélo', strength: 'Force', skill: 'Skill', mobility: 'Mobilité', wod: 'WOD', conditioning: 'Conditioning' }

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
    private readonly googleCalendarService: GoogleCalendarService,
  ) { }

  /**
   * Enrichit un lot de programmes de skill : nom, catégorie, étape en cours et % de progression.
   * Retourne une Map indexée par skill_program_id.
   */
  private async getSkillEnrichment(programIds: string[]): Promise<Map<string, SkillEnrichment>> {
    const map = new Map<string, SkillEnrichment>()
    const uniqueIds = [...new Set(programIds.filter(Boolean))]
    if (uniqueIds.length === 0) return map

    const programs = await this.knex('skill_programs').whereIn('id', uniqueIds)
    const steps = await this.knex('skill_program_steps')
      .whereIn('program_id', uniqueIds)
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
          this.knex.raw(`COALESCE(workouts.workout_type, personalized_workouts.plan_json->>'workout_type') as workout_type`),
          this.knex.raw(`COALESCE(workouts.difficulty, personalized_workouts.plan_json->>'difficulty') as difficulty`),
          this.knex.raw(`COALESCE(workouts.intensity, personalized_workouts.plan_json->>'intensity') as intensity`),
          this.knex.raw(`COALESCE(workouts.estimated_duration, CAST(NULLIF(personalized_workouts.plan_json->>'estimated_duration', '') AS INTEGER)) as estimated_duration`),
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
          scheduled_date: typeof row.scheduled_date === 'string'
            ? row.scheduled_date.slice(0, 10)
            : new Date(row.scheduled_date).toISOString().slice(0, 10),
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
      let saQuery = this.knex('scheduled_activities')
        .where('user_id', userId)

      if (start_date) saQuery = saQuery.where('scheduled_date', '>=', start_date)
      if (end_date) saQuery = saQuery.where('scheduled_date', '<=', end_date)
      if (status) saQuery = saQuery.where('status', status)
      if (moduleFilter) saQuery = saQuery.where('activity_type', moduleFilter)

      const saRows = await saQuery.orderBy('scheduled_date', 'asc')

      // Batch-fetch les strength_sessions liées pour enrichir les activités force planifiées
      const strengthActivityIds = saRows
        .filter(r => r.activity_type === 'strength' && r.activity_id)
        .map(r => r.activity_id)

      const linkedStrengthMap = new Map<string, Record<string, unknown>>()
      if (strengthActivityIds.length > 0) {
        const linked = await this.knex('strength_sessions').whereIn('id', strengthActivityIds)
        for (const s of linked) linkedStrengthMap.set(s.id, s)
      }

      // Batch-fetch les biking_sessions liées pour enrichir les créneaux vélo planifiés
      const bikingActivityIds = saRows
        .filter(r => r.activity_type === 'biking' && r.activity_id)
        .map(r => r.activity_id)

      const linkedBikingMap = new Map<string, Record<string, unknown>>()
      if (bikingActivityIds.length > 0) {
        const linked = await this.knex('biking_sessions').whereIn('id', bikingActivityIds)
        for (const s of linked) linkedBikingMap.set(s.id, s)
      }

      // Batch-fetch les programmes de skill liés pour enrichir les créneaux skill planifiés
      const skillProgramIds = saRows
        .filter(r => r.activity_type === 'skill' && r.activity_id)
        .map(r => r.activity_id)
      const skillEnrichmentMap = await this.getSkillEnrichment(skillProgramIds)

      for (const row of saRows) {
        let title = ACTIVITY_LABELS[row.activity_type] || row.activity_type
        let target_muscles: string[] | undefined
        let session_goal: string | undefined
        let skillFields: Partial<UnifiedActivity> = {}

        if (row.activity_type === 'strength' && row.activity_id) {
          const session = linkedStrengthMap.get(row.activity_id)
          if (session) {
            const aiPlan = session.ai_plan as Record<string, unknown> | null
            title = (aiPlan?.session_name as string) || 'Séance Force'
            target_muscles = Array.isArray(session.target_muscles) ? session.target_muscles : []
            session_goal = session.session_goal as string | undefined
          }
        } else if (row.activity_type === 'biking' && row.activity_id) {
          const session = linkedBikingMap.get(row.activity_id)
          if (session) {
            const aiPlan = session.ai_plan as Record<string, unknown> | null
            title = (aiPlan?.name as string) || ACTIVITY_LABELS.biking
          }
        } else if (row.activity_type === 'skill' && row.activity_id) {
          const skill = skillEnrichmentMap.get(row.activity_id)
          if (skill) {
            title = skill.title
            skillFields = {
              skill_program_id: skill.skill_program_id,
              skill_name: skill.skill_name,
              skill_category: skill.skill_category,
              skill_step_title: skill.skill_step_title,
              skill_progress: skill.skill_progress,
            }
          }
        }

        activities.push({
          id: row.id,
          user_id: row.user_id,
          scheduled_date: typeof row.scheduled_date === 'string'
            ? row.scheduled_date.slice(0, 10)
            : new Date(row.scheduled_date).toISOString().slice(0, 10),
          module: row.activity_type,
          status: row.status,
          title,
          notes: row.notes,
          location: row.location,
          created_at: row.created_at,
          updated_at: row.updated_at,
          activity_type: row.activity_type,
          activity_id: row.activity_id,
          target_muscles,
          session_goal,
          ...skillFields,
          _source: 'scheduled_activities',
        })
      }
    }

    // --- Force (strength_sessions) ---
    // N'affiche que les séances NON liées à une scheduled_activity (évite les doublons)
    if (!moduleFilter || moduleFilter === 'strength') {
      if (!status || status === 'completed') {
        // IDs déjà couverts par scheduled_activities
        const scheduledIds = await this.knex('scheduled_activities')
          .where('user_id', userId)
          .where('activity_type', 'strength')
          .whereNotNull('activity_id')
          .pluck('activity_id')

        let ssQuery = this.knex('strength_sessions').where('user_id', userId)
        if (scheduledIds.length > 0) ssQuery = ssQuery.whereNotIn('id', scheduledIds)
        if (start_date) ssQuery = ssQuery.where('session_date', '>=', start_date)
        if (end_date) ssQuery = ssQuery.where('session_date', '<=', end_date)

        const ssRows = await ssQuery.orderBy('session_date', 'asc')

        for (const row of ssRows) {
          const muscles: string[] = Array.isArray(row.target_muscles) ? row.target_muscles : []
          const aiPlan = row.ai_plan as Record<string, unknown> | null
          const title = (aiPlan?.session_name as string) || (muscles.length > 0 ? `Force — ${muscles.slice(0, 2).join(', ')}` : 'Séance Force')

          activities.push({
            id: row.id,
            user_id: row.user_id,
            scheduled_date: typeof row.session_date === 'string'
              ? row.session_date.slice(0, 10)
              : new Date(row.session_date).toISOString().slice(0, 10),
            module: 'strength',
            status: 'completed',
            title,
            notes: row.notes ?? undefined,
            created_at: row.created_at,
            updated_at: row.updated_at,
            target_muscles: muscles,
            session_goal: row.session_goal,
            duration_minutes: row.duration_minutes ?? undefined,
            perceived_effort: row.perceived_effort ?? undefined,
            _source: 'strength_sessions',
          })
        }
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
      throw new ConflictException(`Une activité ${data.activity_type} est déjà planifiée pour cette date`)
    }

    // Vérifie que le programme de skill référencé appartient bien à l'utilisateur
    if (data.activity_type === 'skill' && data.activity_id) {
      const program = await this.knex('skill_programs')
        .where('id', data.activity_id)
        .where('user_id', userId)
        .first()
      if (!program) {
        throw new NotFoundException('Programme de skill non trouvé')
      }
    }

    const [row] = await this.knex('scheduled_activities')
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

    // Sync Google Calendar en arrière-plan (silencieux si non connecté)
    this.googleCalendarService.syncWorkout(userId, {
      name: ACTIVITY_LABELS[data.activity_type] || data.activity_type,
      scheduledDate: data.scheduled_date,
    }).catch(() => undefined)

    let title = ACTIVITY_LABELS[row.activity_type] || row.activity_type
    let target_muscles: string[] | undefined
    let session_goal: string | undefined
    let skillFields: Partial<UnifiedActivity> = {}

    if (row.activity_type === 'strength' && row.activity_id) {
      const session = await this.knex('strength_sessions').where('id', row.activity_id).first()
      if (session) {
        const aiPlan = session.ai_plan as Record<string, unknown> | null
        title = (aiPlan?.session_name as string) || 'Séance Force'
        target_muscles = Array.isArray(session.target_muscles) ? session.target_muscles : []
        session_goal = session.session_goal as string | undefined
      }
    } else if (row.activity_type === 'biking' && row.activity_id) {
      const session = await this.knex('biking_sessions').where('id', row.activity_id).first()
      if (session) {
        const aiPlan = session.ai_plan as Record<string, unknown> | null
        title = (aiPlan?.name as string) || ACTIVITY_LABELS.biking
      }
    } else if (row.activity_type === 'skill' && row.activity_id) {
      const skill = (await this.getSkillEnrichment([row.activity_id])).get(row.activity_id)
      if (skill) {
        title = skill.title
        skillFields = {
          skill_program_id: skill.skill_program_id,
          skill_name: skill.skill_name,
          skill_category: skill.skill_category,
          skill_step_title: skill.skill_step_title,
          skill_progress: skill.skill_progress,
        }
      }
    }

    return {
      id: row.id,
      user_id: row.user_id,
      scheduled_date: typeof row.scheduled_date === 'string'
        ? row.scheduled_date.slice(0, 10)
        : new Date(row.scheduled_date).toISOString().slice(0, 10),
      module: row.activity_type,
      status: row.status,
      title,
      notes: row.notes,
      location: row.location,
      created_at: row.created_at,
      updated_at: row.updated_at,
      activity_type: row.activity_type,
      activity_id: row.activity_id,
      target_muscles,
      session_goal,
      ...skillFields,
      _source: 'scheduled_activities',
    }
  }

  /**
   * Met à jour une activité planifiée (nouveaux modules uniquement)
   */
  async update(id: string, userId: string, data: UpdateScheduledActivityDto): Promise<UnifiedActivity> {
    const existing = await this.knex('scheduled_activities')
      .where('id', id)
      .where('user_id', userId)
      .first()

    if (!existing) {
      throw new NotFoundException('Activité non trouvée')
    }

    if (data.scheduled_date && data.scheduled_date !== existing.scheduled_date) {
      const conflict = await this.knex('scheduled_activities')
        .where('user_id', userId)
        .where('scheduled_date', data.scheduled_date)
        .where('activity_type', existing.activity_type)
        .whereNot('id', id)
        .first()

      if (conflict) {
        throw new ConflictException(`Une activité ${existing.activity_type} est déjà planifiée pour cette date`)
      }
    }

    const [row] = await this.knex('scheduled_activities')
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

    let updateTitle = ACTIVITY_LABELS[row.activity_type] || row.activity_type
    let updateMuscles: string[] | undefined
    let updateGoal: string | undefined
    let updateSkillFields: Partial<UnifiedActivity> = {}

    if (row.activity_type === 'strength' && row.activity_id) {
      const session = await this.knex('strength_sessions').where('id', row.activity_id).first()
      if (session) {
        const aiPlan = session.ai_plan as Record<string, unknown> | null
        updateTitle = (aiPlan?.session_name as string) || 'Séance Force'
        updateMuscles = Array.isArray(session.target_muscles) ? session.target_muscles : []
        updateGoal = session.session_goal as string | undefined
      }
    } else if (row.activity_type === 'biking' && row.activity_id) {
      const session = await this.knex('biking_sessions').where('id', row.activity_id).first()
      if (session) {
        const aiPlan = session.ai_plan as Record<string, unknown> | null
        updateTitle = (aiPlan?.name as string) || ACTIVITY_LABELS.biking
      }
    } else if (row.activity_type === 'skill' && row.activity_id) {
      const skill = (await this.getSkillEnrichment([row.activity_id])).get(row.activity_id)
      if (skill) {
        updateTitle = skill.title
        updateSkillFields = {
          skill_program_id: skill.skill_program_id,
          skill_name: skill.skill_name,
          skill_category: skill.skill_category,
          skill_step_title: skill.skill_step_title,
          skill_progress: skill.skill_progress,
        }
      }
    }

    return {
      id: row.id,
      user_id: row.user_id,
      scheduled_date: typeof row.scheduled_date === 'string'
        ? row.scheduled_date.slice(0, 10)
        : new Date(row.scheduled_date).toISOString().slice(0, 10),
      module: row.activity_type,
      status: row.status,
      title: updateTitle,
      notes: row.notes,
      location: row.location,
      created_at: row.created_at,
      updated_at: row.updated_at,
      activity_type: row.activity_type,
      activity_id: row.activity_id,
      target_muscles: updateMuscles,
      session_goal: updateGoal,
      ...updateSkillFields,
      _source: 'scheduled_activities',
    }
  }

  /**
   * Supprime une activité planifiée (nouveaux modules uniquement)
   */
  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    const deleted = await this.knex('scheduled_activities')
      .where('id', id)
      .where('user_id', userId)
      .delete()

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
