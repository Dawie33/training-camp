import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { UserContextService } from 'src/user-context/user-context.service'
import { toDateOnly, toParisDate } from 'src/common/utils/date-only'
import { GoogleCalendarService } from 'src/google-calendar/google-calendar.service'
import {
  hasConsecutiveSteps,
  RecommendedExerciseSchema,
  ValidationCriteriaSchema,
} from '../schemas/skill-program.schema'
import {
  CreateSkillProgramDto,
  CreateSkillProgressLogDto,
  UpdateSkillProgramDto,
  UpdateSkillStepDto,
} from '../dto/skill.dto'

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name)

  constructor(
    @InjectModel() private readonly knex: Knex,
    private readonly userContextService: UserContextService,
    private readonly googleCalendarService: GoogleCalendarService
  ) {}

  private removeFutureActivities(trx: Knex.Transaction, programId: string, userId: string) {
    return trx('scheduled_activities')
      .where({ user_id: userId, activity_type: 'skill', activity_id: programId, status: 'scheduled' })
      .where('scheduled_date', '>=', toParisDate(new Date()))
      .delete<{ google_event_id: string | null }[]>(['google_event_id'])
  }

  private async afterCommit(userId: string, removed: { google_event_id: string | null }[] = []) {
    this.userContextService.invalidateCache(userId)
    for (const row of removed) {
      if (!row.google_event_id) continue
      try {
        await this.googleCalendarService.deleteEvent(userId, row.google_event_id)
      } catch {
        this.logger.warn('Suppression Google Calendar impossible apres modification du programme')
      }
    }
  }

  async findAll(userId: string, status?: string) {
    let query = this.knex('skill_programs').select('skill_programs.*').where({ user_id: userId })

    if (status) {
      query = query.where('status', status)
    }

    const programs = await query.orderBy('created_at', 'desc')

    const programIds = programs.map(p => p.id)
    if (programIds.length === 0) return []

    const stepCounts = await this.knex('skill_program_steps')
      .select('program_id')
      .count('* as total_steps')
      .whereIn('program_id', programIds)
      .groupBy('program_id')

    const completedCounts = await this.knex('skill_program_steps')
      .select('program_id')
      .count('* as completed_steps')
      .whereIn('program_id', programIds)
      .whereIn('status', ['completed', 'skipped'])
      .groupBy('program_id')

    const stepCountMap = Object.fromEntries(stepCounts.map(s => [s.program_id, Number(s.total_steps)]))
    const completedMap = Object.fromEntries(completedCounts.map(s => [s.program_id, Number(s.completed_steps)]))

    return programs.map(p => ({
      ...p,
      total_steps: stepCountMap[p.id] || 0,
      completed_steps: completedMap[p.id] || 0,
    }))
  }

  async findOne(id: string, userId: string) {
    const program = await this.knex('skill_programs').where({ id, user_id: userId }).first()

    if (!program) {
      throw new NotFoundException('Programme de skill non trouve')
    }

    const steps = await this.knex('skill_program_steps').where({ program_id: id }).orderBy('step_number', 'asc')

    return { ...program, steps }
  }

  async create(userId: string, data: CreateSkillProgramDto) {
    if (!hasConsecutiveSteps(data.steps)) {
      throw new BadRequestException('Les etapes doivent etre numerotees de 1 a N dans l ordre')
    }
    for (const step of data.steps) {
      if (
        (step.validation_criteria != null && !ValidationCriteriaSchema.safeParse(step.validation_criteria).success) ||
        (step.recommended_exercises != null &&
          !RecommendedExerciseSchema.array().min(2).safeParse(step.recommended_exercises).success)
      ) {
        throw new BadRequestException('Criteres ou exercices de l etape invalides')
      }
    }
    const result = await this.knex.transaction(async trx => {
      const [program] = await trx('skill_programs')
        .insert({
          user_id: userId,
          skill_name: data.skill_name,
          skill_category: data.skill_category,
          description: data.description || null,
          estimated_weeks: data.estimated_weeks || null,
          ai_parameters: data.ai_parameters ? JSON.stringify(data.ai_parameters) : null,
          progression_notes: data.progression_notes || null,
          safety_notes: data.safety_notes || null,
          status: 'active',
          started_at: new Date(),
        })
        .returning('*')

      const stepsToInsert = data.steps.map((step, index) => ({
        program_id: program.id,
        step_number: step.step_number,
        title: step.title,
        description: step.description || null,
        validation_criteria: step.validation_criteria ? JSON.stringify(step.validation_criteria) : null,
        recommended_exercises: step.recommended_exercises ? JSON.stringify(step.recommended_exercises) : null,
        coaching_tips: step.coaching_tips || null,
        estimated_duration_weeks: step.estimated_duration_weeks || null,
        frequency: step.frequency ?? null,
        when_to_train: step.when_to_train ?? null,
        warmup: step.warmup ?? null,
        status: index === 0 ? 'in_progress' : 'locked',
        unlocked_at: index === 0 ? new Date() : null,
      }))

      const steps = await trx('skill_program_steps').insert(stepsToInsert).returning('*')

      return { ...program, steps }
    })
    await this.afterCommit(userId)
    return result
  }

  async updateProgram(id: string, userId: string, data: UpdateSkillProgramDto) {
    const { updated, removed } = await this.knex.transaction(async trx => {
      const program = await trx('skill_programs').where({ id, user_id: userId }).forUpdate().first()

      if (!program) {
        throw new NotFoundException('Programme de skill non trouve')
      }

      const updateData: Record<string, unknown> = { updated_at: new Date() }
      if (data.status) {
        updateData.status = data.status
        if (data.status === 'completed') {
          updateData.completed_at = new Date()
        } else {
          updateData.completed_at = null
        }
      }
      if (data.progression_notes !== undefined) {
        updateData.progression_notes = data.progression_notes
      }

      const [updated] = await trx('skill_programs').where({ id, user_id: userId }).update(updateData).returning('*')
      const removed =
        data.status === 'completed' || data.status === 'abandoned'
          ? await this.removeFutureActivities(trx, id, userId)
          : []
      return { updated, removed }
    })
    await this.afterCommit(userId, removed)
    return updated
  }

  async updateStep(programId: string, stepId: string, userId: string, data: UpdateSkillStepDto) {
    const { updatedStep, removed } = await this.knex.transaction(async trx => {
      const program = await trx('skill_programs').where({ id: programId, user_id: userId }).forUpdate().first()

      if (!program) {
        throw new NotFoundException('Programme de skill non trouve')
      }

      const step = await trx('skill_program_steps').where({ id: stepId, program_id: programId }).first()

      if (!step) {
        throw new NotFoundException('Etape non trouvee')
      }
      if (program.status !== 'active') {
        throw new ConflictException('Le programme doit etre actif')
      }
      if (data.status && (step.status !== 'in_progress' || !['completed', 'skipped'].includes(data.status))) {
        throw new ConflictException('Seule l etape en cours peut etre terminee ou passee')
      }

      const updateData: Record<string, unknown> = { updated_at: new Date() }

      if (data.status) {
        updateData.status = data.status
        if (data.manually_overridden) {
          updateData.manually_overridden = true
        }
        if (data.status === 'completed' || data.status === 'skipped') {
          updateData.completed_at = new Date()
        }
      }

      const [updatedStep] = await trx('skill_program_steps')
        .where({ id: stepId, program_id: programId })
        .update(updateData)
        .returning('*')
      let removed: { google_event_id: string | null }[] = []

      // If step completed/skipped, unlock next step
      if (data.status === 'completed' || data.status === 'skipped') {
        const nextStep = await trx('skill_program_steps')
          .where({ program_id: programId, step_number: step.step_number + 1 })
          .first()

        if (nextStep && nextStep.status === 'locked') {
          await trx('skill_program_steps')
            .where({ id: nextStep.id })
            .update({ status: 'in_progress', unlocked_at: new Date(), updated_at: new Date() })
        }

        // Check if all steps are completed/skipped -> complete program
        const remainingSteps = await trx('skill_program_steps')
          .where({ program_id: programId })
          .whereNotIn('status', ['completed', 'skipped'])
          .count('* as count')
          .first()

        if (Number(remainingSteps?.count) === 0) {
          await trx('skill_programs')
            .where({ id: programId })
            .update({ status: 'completed', completed_at: new Date(), updated_at: new Date() })
          removed = await this.removeFutureActivities(trx, programId, userId)
        }
      }

      return { updatedStep, removed }
    })
    await this.afterCommit(userId, removed)
    return updatedStep
  }

  async deleteProgram(id: string, userId: string) {
    const removed = await this.knex.transaction(async trx => {
      const program = await trx('skill_programs').where({ id, user_id: userId }).forUpdate().first()

      if (!program) {
        throw new NotFoundException('Programme de skill non trouve')
      }

      const removed = await this.removeFutureActivities(trx, id, userId)
      await trx('skill_programs').where({ id, user_id: userId }).delete()
      return removed
    })
    await this.afterCommit(userId, removed)
    return { success: true }
  }

  async logProgress(userId: string, data: CreateSkillProgressLogDto) {
    if (data.session_date > toParisDate(new Date())) {
      throw new BadRequestException('La date de seance ne peut pas etre future')
    }
    const log = await this.knex.transaction(async trx => {
      const step = await trx('skill_program_steps')
        .join('skill_programs', 'skill_programs.id', 'skill_program_steps.program_id')
        .where({ 'skill_program_steps.id': data.step_id, 'skill_programs.user_id': userId })
        .first('skill_program_steps.*')

      if (!step) {
        throw new NotFoundException('Etape non trouvee')
      }

      const program = await trx('skill_programs').where({ id: step.program_id, user_id: userId }).forUpdate().first()
      if (!program) throw new NotFoundException('Programme de skill non trouve')

      const [log] = await trx('skill_progress_logs')
        .insert({
          step_id: data.step_id,
          user_id: userId,
          session_date: data.session_date,
          performance_data: data.performance_data ? JSON.stringify(data.performance_data) : null,
          session_notes: data.session_notes || null,
        })
        .returning('*')

      await trx('scheduled_activities')
        .where({
          user_id: userId,
          activity_type: 'skill',
          activity_id: step.program_id,
          scheduled_date: data.session_date,
          status: 'scheduled',
        })
        .update({ status: 'completed', updated_at: new Date() })
      return log
    })
    await this.afterCommit(userId)
    return { ...log, session_date: toDateOnly(log.session_date) }
  }

  async getStepLogs(stepId: string, userId: string) {
    const step = await this.knex('skill_program_steps')
      .join('skill_programs', 'skill_programs.id', 'skill_program_steps.program_id')
      .where({ 'skill_program_steps.id': stepId, 'skill_programs.user_id': userId })
      .first('skill_program_steps.id')

    if (!step) {
      throw new NotFoundException('Etape non trouvee')
    }

    const logs = await this.knex('skill_progress_logs')
      .where({ step_id: stepId, user_id: userId })
      .orderBy('session_date', 'desc')
    return logs.map(log => ({ ...log, session_date: toDateOnly(log.session_date) }))
  }

  async deleteLog(logId: string, userId: string) {
    const removed = await this.knex.transaction(async trx => {
      const log = await trx('skill_progress_logs')
        .join('skill_program_steps', 'skill_program_steps.id', 'skill_progress_logs.step_id')
        .where({ 'skill_progress_logs.id': logId, 'skill_progress_logs.user_id': userId })
        .first('skill_progress_logs.*', 'skill_program_steps.program_id')
      if (!log) throw new NotFoundException('Log non trouve')

      const program = await trx('skill_programs').where({ id: log.program_id, user_id: userId }).forUpdate().first()
      if (!program) throw new NotFoundException('Programme de skill non trouve')

      await trx('skill_progress_logs').where({ id: logId, user_id: userId }).delete()
      const remaining = await trx('skill_progress_logs')
        .join('skill_program_steps', 'skill_program_steps.id', 'skill_progress_logs.step_id')
        .where({
          'skill_program_steps.program_id': log.program_id,
          'skill_progress_logs.user_id': userId,
          'skill_progress_logs.session_date': toDateOnly(log.session_date),
        })
        .first('skill_progress_logs.id')
      if (!remaining) {
        const activity = trx('scheduled_activities').where({
          user_id: userId,
          activity_type: 'skill',
          activity_id: log.program_id,
          scheduled_date: toDateOnly(log.session_date),
          status: 'completed',
        })
        if (
          ['completed', 'abandoned'].includes(program.status) &&
          toDateOnly(log.session_date) >= toParisDate(new Date())
        ) {
          return activity.delete<{ google_event_id: string | null }[]>(['google_event_id'])
        }
        await activity.update({ status: 'scheduled', updated_at: new Date() })
      }
      return []
    })
    await this.afterCommit(userId, removed)
    return { success: true }
  }
}
