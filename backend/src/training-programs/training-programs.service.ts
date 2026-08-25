import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { AIProgramGeneratorService } from './ai-program-generator.service'
import { CreateProgramDto } from './dto/create-program.dto'
import { ScheduleWeekDto, SwapSessionDto, UpdateEnrollmentDto } from './dto/update-enrollment.dto'
import type { ProgramPhase, ProgramSession } from './schemas/program.schema'

export interface ProgramRecommendationContext {
  has_active_program: boolean
  program_name?: string
  objectives?: string | null
  current_week?: number
  total_weeks?: number
  sessions_per_week?: number
  current_phase?: { phase_number: number; name: string; description: string }
  week_planned_focuses?: string[]
  today_session?: { title: string; focus: string; estimated_duration: number } | null
}

export interface WeeklyProgression {
  week_in_phase: number
  phase_length: number
  deload: boolean
  intensity_delta: number // points de % ajoutés (négatif en deload)
}

// Points de % 1RM ajoutés par semaine à l'intérieur d'une phase (surcharge progressive)
const INTENSITY_STEP = 5

// Ajuste la première valeur "NN%" d'une chaîne d'intensité (ex: "75% 1RM" -> "80% 1RM")
function adjustIntensityString(
  intensity: string | null | undefined,
  deltaPts: number,
): string | null | undefined {
  if (!intensity || deltaPts === 0) return intensity
  return intensity.replace(/(\d{1,3})(\s*%)/, (_m, num: string, suffix: string) => {
    const v = Math.min(95, Math.max(40, parseInt(num, 10) + deltaPts))
    return `${v}${suffix}`
  })
}

/**
 * Applique une surcharge progressive déterministe à une séance selon sa position
 * dans la phase : l'intensité monte semaine après semaine, avec un deload sur la
 * dernière semaine des phases de 3 semaines ou plus.
 */
function applyWeeklyProgression(
  session: ProgramSession,
  weekInPhase: number,
  phaseLength: number,
): ProgramSession & { _progression: WeeklyProgression } {
  const deload = phaseLength >= 3 && weekInPhase === phaseLength
  const deltaPts = deload ? -10 : (weekInPhase - 1) * INTENSITY_STEP

  let strength_work = session.strength_work
  if (strength_work && deltaPts !== 0) {
    strength_work = {
      movements: strength_work.movements.map((m) => ({
        ...m,
        intensity: adjustIntensityString(m.intensity, deltaPts),
        sets: deload ? Math.max(1, m.sets - 1) : m.sets,
      })),
    }
  }

  let conditioning = session.conditioning
  if (conditioning && deload) {
    conditioning = {
      ...conditioning,
      duration_minutes: conditioning.duration_minutes
        ? Math.round(conditioning.duration_minutes * 0.7)
        : conditioning.duration_minutes,
      rounds: conditioning.rounds ? Math.max(1, Math.round(conditioning.rounds * 0.7)) : conditioning.rounds,
      scaling_notes: [conditioning.scaling_notes, 'Semaine de récupération : réduis le volume et garde de la marge.']
        .filter(Boolean)
        .join(' '),
    }
  }

  return {
    ...session,
    strength_work,
    conditioning,
    _progression: { week_in_phase: weekInPhase, phase_length: phaseLength, deload, intensity_delta: deltaPts },
  }
}

@Injectable()
export class TrainingProgramsService {
  constructor(
    @InjectModel() private readonly knex: Knex,
    private readonly aiGenerator: AIProgramGeneratorService,
  ) { }

  /**
   * Crée un programme IA et inscrit l'utilisateur
   */
  async createAndEnroll(userId: string, data: CreateProgramDto) {
    return this.knex.transaction(async (trx) => {
      // Vérifier qu'il n'y a pas déjà un programme actif (index partiel DB comme filet de sécurité)
      const activeEnrollment = await trx('user_program_enrollments')
        .where({ user_id: userId })
        .whereIn('status', ['enrolled', 'active'])
        .first()

      if (activeEnrollment) {
        throw new ConflictException('Un programme est déjà actif. Abandonnez-le avant d\'en créer un nouveau.')
      }

      const slug = `prog-${userId.slice(0, 8)}-${Date.now()}`
      const totalSessions = data.duration_weeks * data.sessions_per_week

      const [program] = await trx('training_programs')
        .insert({
          name: data.name,
          slug,
          description: data.description,
          objectives: data.objectives || null,
          target_level: data.target_level,
          duration_weeks: data.duration_weeks,
          sessions_per_week: data.sessions_per_week,
          estimated_session_duration: 60,
          program_type: data.program_type,
          intensity_profile: 'variable',
          volume_profile: 'progressive',
          weekly_structure: JSON.stringify(data.weekly_structure),
          progression_scheme: data.progression_notes ? JSON.stringify({ notes: data.progression_notes }) : null,
          program_status: 'active',
          is_customizable: true,
          is_premium: false,
          is_featured: false,
          enrollment_count: 0,
        })
        .returning('*')

      const [enrollment] = await trx('user_program_enrollments')
        .insert({
          user_id: userId,
          program_id: program.id,
          enrolled_at: new Date(),
          status: 'enrolled',
          current_week: 1,
          completed_sessions: 0,
          total_sessions: totalSessions,
          completion_percentage: 0,
          customizations_applied: JSON.stringify([]),
          schedule_adjustments: JSON.stringify([]),
        })
        .returning('*')

      return { program, enrollment }
    })
  }

  /**
   * Récupère l'enrollment actif de l'utilisateur avec les détails du programme
   */
  async getActiveEnrollment(userId: string) {
    const enrollment = await this.knex('user_program_enrollments as upe')
      .join('training_programs as tp', 'upe.program_id', 'tp.id')
      .where('upe.user_id', userId)
      .whereIn('upe.status', ['enrolled', 'active'])
      .select(
        'upe.id',
        'upe.user_id',
        'upe.program_id',
        'upe.status',
        'upe.current_week',
        'upe.completed_sessions',
        'upe.total_sessions',
        'upe.completion_percentage',
        'upe.enrolled_at',
        'upe.started_at',
        'upe.customizations_applied',
        'upe.schedule_adjustments',
        'tp.name as program_name',
        'tp.description as program_description',
        'tp.objectives as program_objectives',
        'tp.duration_weeks',
        'tp.sessions_per_week',
        'tp.program_type',
        'tp.target_level',
        'tp.weekly_structure',
        'tp.progression_scheme',
      )
      .orderBy('upe.enrolled_at', 'desc')
      .first()

    return enrollment || null
  }

  /**
   * Récupère les sessions d'une semaine donnée en appliquant les customisations
   */
  async getWeekSessions(enrollmentId: string, userId: string, weekNum: number) {
    const enrollment = await this.knex('user_program_enrollments as upe')
      .join('training_programs as tp', 'upe.program_id', 'tp.id')
      .where('upe.id', enrollmentId)
      .where('upe.user_id', userId)
      .select('upe.*', 'tp.weekly_structure', 'tp.duration_weeks', 'tp.sessions_per_week')
      .first()

    if (!enrollment) {
      throw new NotFoundException('Enrollment non trouvé')
    }

    if (weekNum < 1 || weekNum > enrollment.duration_weeks) {
      throw new BadRequestException(`Numéro de semaine invalide (1-${enrollment.duration_weeks})`)
    }

    const structure =
      typeof enrollment.weekly_structure === 'string'
        ? JSON.parse(enrollment.weekly_structure)
        : enrollment.weekly_structure

    const phase: ProgramPhase | undefined = structure.phases.find((p: ProgramPhase) => p.weeks.includes(weekNum))

    if (!phase) {
      throw new NotFoundException(`Aucune session trouvée pour la semaine ${weekNum}`)
    }

    const customizations: Array<{
      week: number
      session_in_week: number
      type: string
      replacement: Record<string, unknown>
    }> = Array.isArray(enrollment.customizations_applied)
        ? enrollment.customizations_applied
        : JSON.parse(enrollment.customizations_applied || '[]')

    const sessions = phase.sessions
      .filter((session: ProgramSession) => session.week === undefined || session.week === weekNum)
      .map((session: ProgramSession) => {
        const swap = customizations.find(
          (c) => c.week === weekNum && c.session_in_week === session.session_in_week,
        )
        if (!swap) return session

        if (swap.type === 'workout') {
          return { ...session, _swapped: true, _swap_workout_id: swap.replacement.workout_id }
        }
        if (swap.type === 'exercise' && swap.replacement.movement_name) {
          // Remplacer l'exercice dans strength_work
          const updatedStrengthWork = session.strength_work
            ? {
              movements: session.strength_work.movements.map((m) =>
                m.name === swap.replacement.movement_name
                  ? { ...m, ...(swap.replacement.exercise as object) }
                  : m,
              ),
            }
            : session.strength_work

          return { ...session, strength_work: updatedStrengthWork, _has_exercise_swap: true }
        }

        return { ...session, ...swap.replacement, _swapped: true }
      })

    const sortedWeeks = [...phase.weeks].sort((a, b) => a - b)
    const weekInPhase = sortedWeeks.indexOf(weekNum) + 1
    const phaseLength = sortedWeeks.length
    const progressedSessions = sessions.map((s) =>
      applyWeeklyProgression(s as ProgramSession, weekInPhase, phaseLength),
    )

    // Séances bonus ajoutées par l'utilisateur pour cette semaine (pas de surcharge progressive)
    const bonusSessions = customizations
      .filter((c) => c.week === weekNum && c.type === 'bonus_session')
      .map((c, i) => ({
        ...(c.replacement.session as ProgramSession),
        session_in_week: progressedSessions.length + i + 1,
        _bonus: true,
      }))

    const scheduledRows = await this.knex('user_workout_schedule')
      .where({ user_id: userId, program_enrollment_id: enrollmentId })
      .whereRaw(`session_data->>'week_num' = ?`, [String(weekNum)])
      .select('id', 'status', this.knex.raw(`(session_data->>'session_in_week')::int as session_in_week`))

    const scheduleByPosition = new Map(
      scheduledRows.map((r) => [r.session_in_week as number, { schedule_id: r.id as string, status: r.status as string }]),
    )

    const allSessions = [...progressedSessions, ...bonusSessions].map((s) => {
      const match = scheduleByPosition.get(s.session_in_week)
      return match ? { ...s, schedule_id: match.schedule_id, status: match.status } : s
    })

    return {
      phase: { ...phase, sessions: undefined },
      sessions: allSessions,
      weekNum,
    }
  }

  /**
   * Génère (IA) et ajoute une séance bonus complémentaire à une semaine donnée.
   * Persistée dans customizations_applied de l'enrollment.
   */
  async addBonusSession(enrollmentId: string, userId: string, weekNum: number, focus?: string) {
    const enrollment = await this.knex('user_program_enrollments as upe')
      .join('training_programs as tp', 'upe.program_id', 'tp.id')
      .where('upe.id', enrollmentId)
      .where('upe.user_id', userId)
      .select('upe.*', 'tp.weekly_structure', 'tp.duration_weeks', 'tp.program_type', 'tp.target_level')
      .first()

    if (!enrollment) {
      throw new NotFoundException('Enrollment non trouvé')
    }
    if (weekNum < 1 || weekNum > enrollment.duration_weeks) {
      throw new BadRequestException(`Numéro de semaine invalide (1-${enrollment.duration_weeks})`)
    }

    // Focus déjà couverts cette semaine (séances de base + bonus existants)
    const { sessions } = await this.getWeekSessions(enrollmentId, userId, weekNum)
    const weekFocuses = sessions.map((s) => s.focus)

    const bonusSession = await this.aiGenerator.generateBonusSession(userId, {
      program_type: enrollment.program_type,
      target_level: enrollment.target_level,
      week_focuses: weekFocuses,
      focus,
    })

    const customizations: Array<Record<string, unknown>> = Array.isArray(enrollment.customizations_applied)
      ? enrollment.customizations_applied
      : JSON.parse(enrollment.customizations_applied || '[]')

    customizations.push({
      week: weekNum,
      type: 'bonus_session',
      session_in_week: 99,
      replacement: { session: bonusSession },
    })

    await this.knex('user_program_enrollments')
      .where({ id: enrollmentId, user_id: userId })
      .update({ customizations_applied: JSON.stringify(customizations) })

    return { ...bonusSession, session_in_week: sessions.length + 1, _bonus: true }
  }

  /**
   * Planifie les sessions d'une semaine dans user_workout_schedule
   * en respectant les jours box et les jours déjà occupés
   */
  async scheduleWeek(enrollmentId: string, userId: string, dto: ScheduleWeekDto) {
    const { sessions } = await this.getWeekSessions(enrollmentId, userId, dto.week_num)

    // Mode 1 : assignation explicite (une date choisie par séance)
    if (dto.assignments && dto.assignments.length > 0) {
      const scheduled: Array<{ date: string; session_title: string; schedule_id: string }> = []
      const seenDates = new Set<string>()

      // Bloque les dates déjà occupées (contrainte unique user/date) avec un
      // message clair plutôt que de laisser Postgres lever une 500.
      const targetDates = dto.assignments.map((a) => a.date)
      const occupiedRows = await this.knex('user_workout_schedule')
        .where('user_id', userId)
        .whereIn('scheduled_date', targetDates)
        .pluck('scheduled_date')
      const occupied = new Set(occupiedRows.map((d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10))))
      const conflicts = [...new Set(targetDates.filter((d) => occupied.has(d)))]
      if (conflicts.length > 0) {
        throw new ConflictException(`Une séance est déjà planifiée le ${conflicts.join(', ')}. Choisis une autre date.`)
      }

      for (const assignment of dto.assignments) {
        const session = sessions[assignment.session_index]
        if (!session) {
          throw new BadRequestException(`Séance ${assignment.session_index} introuvable`)
        }
        if (seenDates.has(assignment.date)) {
          throw new BadRequestException(`Deux séances sont assignées au ${assignment.date}`)
        }
        seenDates.add(assignment.date)

        const [entry] = await this.knex('user_workout_schedule')
          .insert({
            user_id: userId,
            workout_id: null,
            personalized_workout_id: null,
            scheduled_date: assignment.date,
            session_type: 'program_session',
            program_enrollment_id: enrollmentId,
            session_data: JSON.stringify({ ...session, week_num: dto.week_num }),
            status: 'scheduled',
          })
          .returning('*')

        scheduled.push({ date: assignment.date, session_title: session.title, schedule_id: entry.id })
      }

      return { scheduled, box_dates_skipped: dto.box_dates ?? [], week_num: dto.week_num }
    }

    // Mode 2 : auto-distribution à partir de start_date
    if (!dto.start_date) {
      throw new BadRequestException('start_date ou assignments requis')
    }

    // Construire les 7 dates de la semaine à partir de start_date
    const allDates: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(dto.start_date)
      d.setDate(d.getDate() + i)
      allDates.push(d.toISOString().split('T')[0])
    }

    // Exclure les jours box et les jours déjà occupés
    const occupiedDates = await this.knex('user_workout_schedule')
      .where('user_id', userId)
      .whereIn('scheduled_date', allDates)
      .pluck('scheduled_date')

    const usedDates = new Set([...(dto.box_dates ?? []), ...occupiedDates])
    const availableDates = allDates.filter((d) => !usedDates.has(d))

    if (availableDates.length < sessions.length) {
      throw new BadRequestException(
        `Pas assez de jours disponibles (${availableDates.length} disponibles, ${sessions.length} séances à planifier)`,
      )
    }

    const scheduled: Array<{ date: string; session_title: string; schedule_id: string }> = []

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i]
      const date = availableDates[i]

      const [entry] = await this.knex('user_workout_schedule')
        .insert({
          user_id: userId,
          workout_id: null,
          personalized_workout_id: null,
          scheduled_date: date,
          session_type: 'program_session',
          program_enrollment_id: enrollmentId,
          session_data: JSON.stringify({ ...session, week_num: dto.week_num }),
          status: 'scheduled',
        })
        .returning('*')

      scheduled.push({ date, session_title: session.title, schedule_id: entry.id })
    }

    return { scheduled, box_dates_skipped: dto.box_dates ?? [], week_num: dto.week_num }
  }

  /**
   * Swap d'une session (workout entier ou exercice individuel)
   */
  async swapSession(
    enrollmentId: string,
    userId: string,
    weekNum: number,
    sessionInWeek: number,
    data: SwapSessionDto,
  ) {
    const enrollment = await this.knex('user_program_enrollments')
      .where({ id: enrollmentId, user_id: userId })
      .first()

    if (!enrollment) {
      throw new NotFoundException('Enrollment non trouvé')
    }

    const customizations: unknown[] = Array.isArray(enrollment.customizations_applied)
      ? enrollment.customizations_applied
      : JSON.parse(enrollment.customizations_applied || '[]')

    // Supprimer un éventuel swap existant pour cette session
    const filtered = (
      customizations as Array<{ week: number; session_in_week: number }>
    ).filter((c) => !(c.week === weekNum && c.session_in_week === sessionInWeek))

    let newSwap: Record<string, unknown>

    if (data.swap_type === 'workout') {
      if (!data.workout_id) throw new BadRequestException('workout_id requis pour swap_type workout')
      const workout = await this.knex('workouts').where({ id: data.workout_id }).first()
      if (!workout) throw new NotFoundException('Workout non trouvé')
      newSwap = {
        week: weekNum,
        session_in_week: sessionInWeek,
        type: 'workout',
        replacement: { workout_id: data.workout_id, workout_name: workout.name },
      }
    } else if (data.swap_type === 'exercise') {
      if (!data.movement_name || !data.replacement_exercise) {
        throw new BadRequestException('movement_name et replacement_exercise requis pour swap_type exercise')
      }
      newSwap = {
        week: weekNum,
        session_in_week: sessionInWeek,
        type: 'exercise',
        replacement: { movement_name: data.movement_name, exercise: data.replacement_exercise },
      }
    } else {
      // ai_regenerate : stocker les instructions
      newSwap = {
        week: weekNum,
        session_in_week: sessionInWeek,
        type: 'ai_regenerate',
        replacement: { instructions: data.instructions, needs_regeneration: true },
      }
    }

    ; (filtered as unknown[]).push(newSwap)

    await this.knex('user_program_enrollments').where({ id: enrollmentId }).update({
      customizations_applied: JSON.stringify(filtered),
      updated_at: new Date(),
    })

    // Si la semaine est déjà planifiée, mettre à jour le session_data du row correspondant
    const scheduledEntry = await this.knex('user_workout_schedule')
      .where({ user_id: userId, program_enrollment_id: enrollmentId })
      .whereRaw(`session_data->>'session_in_week' = ? AND session_data->>'week_num' = ?`, [String(sessionInWeek), String(weekNum)])
      .first()

    if (scheduledEntry) {
      const currentData = typeof scheduledEntry.session_data === 'string'
        ? JSON.parse(scheduledEntry.session_data)
        : scheduledEntry.session_data || {}

      let updatedData = { ...currentData }

      if (data.swap_type === 'exercise' && data.movement_name && data.replacement_exercise) {
        if (updatedData.strength_work?.movements) {
          updatedData.strength_work.movements = updatedData.strength_work.movements.map(
            (m: { name: string }) =>
              m.name === data.movement_name ? { ...m, ...data.replacement_exercise } : m,
          )
        }
        updatedData._has_exercise_swap = true
      } else if (data.swap_type === 'workout') {
        updatedData = { ...updatedData, _swapped: true, _swap_workout_id: data.workout_id }
      }

      await this.knex('user_workout_schedule').where({ id: scheduledEntry.id }).update({
        session_data: JSON.stringify(updatedData),
        updated_at: new Date(),
      })
    }

    return { success: true, swap_applied: newSwap }
  }

  /**
   * Met à jour le statut de l'enrollment (start, pause, abandon, avancer semaine)
   */
  async updateEnrollment(enrollmentId: string, userId: string, data: UpdateEnrollmentDto) {
    const enrollment = await this.knex('user_program_enrollments')
      .where({ id: enrollmentId, user_id: userId })
      .first()

    if (!enrollment) {
      throw new NotFoundException('Enrollment non trouvé')
    }

    const updates: Record<string, unknown> = { updated_at: new Date() }

    if (data.status) {
      updates.status = data.status
      if (data.status === 'active' && !enrollment.started_at) {
        updates.started_at = new Date()
      }
      if (data.status === 'completed') {
        updates.completed_at = new Date()
        updates.completion_percentage = 100
      }
      if (data.status === 'paused') {
        updates.last_pause_at = new Date()
      }
    }

    if (data.current_week) {
      updates.current_week = data.current_week
    }

    const [updated] = await this.knex('user_program_enrollments')
      .where({ id: enrollmentId })
      .update(updates)
      .returning('*')

    return updated
  }

  /**
   * Incrémente la semaine courante si toutes les sessions de la semaine sont complètes
   */
  async checkAndAdvanceWeek(enrollmentId: string, userId: string) {
    const enrollment = await this.knex('user_program_enrollments')
      .where({ id: enrollmentId, user_id: userId })
      .first()

    if (!enrollment || !['enrolled', 'active'].includes(enrollment.status)) {
      return null
    }

    // Compter les sessions programme de la semaine courante
    const weekScheduled = await this.knex('user_workout_schedule')
      .where({ user_id: userId, program_enrollment_id: enrollmentId })
      .whereRaw(`session_data->>'session_in_week' IS NOT NULL`)
      .count('* as total')

    const weekCompleted = await this.knex('user_workout_schedule')
      .where({ user_id: userId, program_enrollment_id: enrollmentId, status: 'completed' })
      .count('* as total')

    const total = Number((weekScheduled[0] as { total: string }).total)
    const completed = Number((weekCompleted[0] as { total: string }).total)

    if (total > 0 && completed >= total) {
      const nextWeek = enrollment.current_week + 1
      if (nextWeek > enrollment.total_sessions / enrollment.sessions_per_week) {
        return { auto_advanced: false, all_done: true }
      }
      return { auto_advanced: true, week_completed: enrollment.current_week, next_week: nextWeek }
    }

    return { auto_advanced: false, completed, total }
  }

  /**
   * Contexte léger du programme actif, destiné à aligner la recommandation
   * "séance du jour" sur le programme en cours (phase, focus de la semaine,
   * séance planifiée aujourd'hui).
   */
  async getRecommendationContext(userId: string): Promise<ProgramRecommendationContext> {
    const enrollment = await this.getActiveEnrollment(userId)
    if (!enrollment) {
      return { has_active_program: false }
    }

    const ctx: ProgramRecommendationContext = {
      has_active_program: true,
      program_name: enrollment.program_name,
      objectives: enrollment.program_objectives ?? null,
      current_week: enrollment.current_week,
      total_weeks: enrollment.duration_weeks,
      sessions_per_week: enrollment.sessions_per_week,
    }

    // Phase courante + focus planifiés de la semaine (best-effort)
    try {
      const { phase, sessions } = await this.getWeekSessions(enrollment.id, userId, enrollment.current_week)
      if (phase) {
        const p = phase as { phase_number: number; name: string; description: string }
        ctx.current_phase = {
          phase_number: p.phase_number,
          name: p.name,
          description: p.description,
        }
      }
      ctx.week_planned_focuses = (sessions as ProgramSession[]).map((s) => s.focus)
    } catch {
      // structure indisponible pour cette semaine — on continue sans le détail
    }

    // Séance programme planifiée aujourd'hui (non complétée)
    const today = new Date().toISOString().split('T')[0]
    const todayRow = await this.knex('user_workout_schedule')
      .where({ user_id: userId, program_enrollment_id: enrollment.id })
      .whereRaw('scheduled_date = ?', [today])
      .whereNot('status', 'completed')
      .first()

    if (todayRow?.session_data) {
      const data =
        typeof todayRow.session_data === 'string' ? JSON.parse(todayRow.session_data) : todayRow.session_data
      if (data?.title && data?.focus) {
        ctx.today_session = {
          title: data.title,
          focus: data.focus,
          estimated_duration: data.estimated_duration ?? 60,
        }
      }
    }

    return ctx
  }
}
