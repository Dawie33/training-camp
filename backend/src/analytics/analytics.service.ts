import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { BenchmarkEntry, computeBenchmarkProgress } from './calculators/benchmark-progress'
import { computeEnergySystems } from './calculators/energy-systems'
import { computeMovementExposure, LoggedExercise } from './calculators/movement-exposure'
import { computeRunning, readFitActivities, RunningSessionInput } from './calculators/running'
import { computeSkillProgress, SkillProgramRow, SkillStepRow } from './calculators/skill-progress'
import { computeStrengthHistory, OneRepMaxEntry } from './calculators/strength-history'
import { computeStrengthRatios } from './calculators/strength-ratios'
import { computeTrainingLoad, resolveSessionMinutes } from './calculators/training-load'
import { computeTrainingVolume } from './calculators/training-volume'
import { WodAnalysisSchema } from '../workout-sessions/schemas/wod-analysis.schema'
import {
  BenchmarkProgress,
  EnergySystemsResult,
  LatestSession,
  MovementExposureResult,
  RunningResult,
  SessionAnalysis,
  SkillProgressResult,
  StrengthHistoryResult,
  StrengthRatiosResult,
  TrainingLoadResult,
  TrainingVolumeResult,
} from './types/analytics.types'

export interface PerformanceOverview {
  period_months: number
  strength_ratios: StrengthRatiosResult
  benchmarks: BenchmarkProgress[]
  energy_systems: EnergySystemsResult
  strength_history: StrengthHistoryResult
  volume: TrainingVolumeResult
  load: TrainingLoadResult
  movements: MovementExposureResult
  skills: SkillProgressResult
  /** Course à pied, lue dans les fichiers .fit importés au log de séance. */
  running: RunningResult
  /** Dernière séance terminée et relecture de son analyse stockée — aucune génération IA déclenchée ici. */
  latest_session: LatestSession | null
  computed_at: string
}

interface SessionRow {
  started_at: string
  completed_at: string | null
  results: Record<string, unknown> | null
}

@Injectable()
export class AnalyticsService {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  /**
   * Assemble le diagnostic de performance de l'athlète sur la période demandée.
   *
   * Aucune donnée n'est inventée ni estimée : chaque métrique est calculée à partir de ce
   * qui a réellement été enregistré. Les blocs sans données suffisantes se déclarent
   * indisponibles plutôt que de renvoyer des zéros trompeurs.
   *
   * @param userId ID de l'utilisateur
   * @param months Profondeur d'analyse en mois
   * @returns Le diagnostic complet
   */
  async getOverview(userId: string, months = 3): Promise<PerformanceOverview> {
    const since = new Date()
    since.setMonth(since.getMonth() - months)
    const sinceISO = since.toISOString()
    // La course compare les 28 derniers jours aux 28 d'avant : il faut au moins 56 jours d'historique,
    // même quand la période demandée est plus courte.
    const now = new Date()
    const runningSince = new Date(Math.min(since.getTime(), now.getTime() - 56 * 24 * 3600 * 1000))

    const [
      sessions,
      oneRepMaxRows,
      benchmarkRows,
      oneRepMaxHistoryRows,
      skillPrograms,
      skillSteps,
      latestSessionRow,
      firstSessionRow,
      fitSessionRows,
    ] = await Promise.all([
      this.knex('workout_sessions')
        .select('started_at', 'completed_at', 'results')
        .where('user_id', userId)
        .whereNotNull('completed_at')
        .where('started_at', '>=', sinceISO)
        .orderBy('started_at', 'asc') as Promise<SessionRow[]>,

      this.knex('one_rep_maxes').select('lift', 'value', 'source').where('user_id', userId),

      // Benchmarks non bornés à la période : un même benchmark se reteste rarement,
      // une fenêtre de quelques mois n'aurait souvent qu'un point à comparer.
      this.knex('benchmark_history')
        .select(
          'workout_id',
          'workout_name',
          'score_type',
          'score_value',
          'extra_reps',
          'calculated_level',
          'measured_at'
        )
        .where('user_id', userId)
        .orderBy('measured_at', 'asc'),

      // Historique de force non borné à la période : une courbe de 1RM n'a de sens
      // que sur la durée, et les mesures sont trop espacées pour une fenêtre courte.
      this.knex('one_rep_max_history')
        .select('lift', 'value', 'source', 'measured_at')
        .where('user_id', userId)
        .orderBy('measured_at', 'asc'),

      this.knex('skill_programs')
        .select('id as program_id', 'skill_name', 'skill_category')
        .where('user_id', userId)
        .where('status', 'active') as Promise<SkillProgramRow[]>,

      this.knex('skill_program_steps as sps')
        .join('skill_programs as sp', 'sps.program_id', 'sp.id')
        .select('sps.program_id', 'sps.title', 'sps.status')
        .where('sp.user_id', userId)
        .where('sp.status', 'active') as Promise<SkillStepRow[]>,

      this.knex('workout_sessions as ws')
        .leftJoin('workouts as w', 'ws.workout_id', 'w.id')
        .leftJoin('personalized_workouts as pw', 'ws.personalized_workout_id', 'pw.id')
        .select(
          'ws.id',
          'ws.started_at',
          'ws.ai_analysis',
          this.knex.raw("COALESCE(w.name, pw.plan_json->>'name') as workout_name")
        )
        .where('ws.user_id', userId)
        // La vraie dernière séance, analysée ou non : filtrer sur ai_analysis afficherait
        // une vieille séance dès que l'athlète ne lance pas l'analyse.
        .whereNotNull('ws.completed_at')
        .orderBy('ws.started_at', 'desc')
        .first(),

      // Toute première séance, hors période : la régularité ne pénalise pas les semaines
      // d'avant l'arrivée de l'athlète dans l'app.
      this.knex('workout_sessions')
        .min('started_at as first_started_at')
        .where('user_id', userId)
        .whereNotNull('completed_at')
        .first() as Promise<{ first_started_at: string | null } | undefined>,

      // Séances avec un import .fit : seule source de distance et d'allure pour la course
      this.knex('workout_sessions')
        .select('started_at', 'results')
        .where('user_id', userId)
        .whereNotNull('completed_at')
        .whereRaw("results->'coros' is not null")
        .where('started_at', '>=', runningSince.toISOString())
        .orderBy('started_at', 'asc') as Promise<SessionRow[]>,
    ])

    const oneRepMaxes: Record<string, number> = {}
    const estimatedLifts = new Set<string>()
    for (const row of oneRepMaxRows) {
      const value = Number(row.value)
      if (!Number.isFinite(value) || value <= 0) continue
      oneRepMaxes[row.lift] = value
      if (row.source === 'estimated') estimatedLifts.add(row.lift)
    }

    const benchmarkEntries: BenchmarkEntry[] = benchmarkRows.map(row => ({
      workout_id: row.workout_id,
      workout_name: row.workout_name,
      score_type: row.score_type,
      score_value: Number(row.score_value),
      extra_reps: row.extra_reps !== null ? Number(row.extra_reps) : null,
      calculated_level: row.calculated_level,
      measured_at: new Date(row.measured_at).toISOString(),
    }))

    // Deux durées distinctes : le chrono du metcon classe la filière, la séance entière pondère le RPE.
    const durations = sessions.map(session => ({
      started_at: new Date(session.started_at).toISOString(),
      duration_seconds: this.resolveDurationSeconds(session),
      session_minutes: resolveSessionMinutes(session.results),
      rpe: this.readNumber(session.results, 'rpe'),
    }))

    const loggedExercises = sessions.flatMap((session, index) => this.readExerciseResults(session.results, index))

    const strengthEntries: OneRepMaxEntry[] = oneRepMaxHistoryRows.map(row => ({
      lift: row.lift,
      value: Number(row.value),
      measured_at: new Date(row.measured_at).toISOString(),
      source: row.source,
    }))

    const runningSessions: RunningSessionInput[] = fitSessionRows.map(row => ({
      started_at: new Date(row.started_at).toISOString(),
      activities: readFitActivities(row.results),
    }))

    return {
      period_months: months,
      strength_ratios: computeStrengthRatios(oneRepMaxes, estimatedLifts),
      strength_history: computeStrengthHistory(strengthEntries),
      benchmarks: computeBenchmarkProgress(benchmarkEntries),
      energy_systems: computeEnergySystems(durations),
      volume: computeTrainingVolume(durations, this.resolveVolumeWindowStart(since, firstSessionRow?.first_started_at)),
      load: computeTrainingLoad(durations),
      movements: computeMovementExposure(loggedExercises, oneRepMaxes),
      skills: computeSkillProgress(skillPrograms, skillSteps),
      running: computeRunning(runningSessions, since, now),
      latest_session: this.readLatestSession(latestSessionRow),
      computed_at: new Date().toISOString(),
    }
  }

  /** Début de la fenêtre de régularité : le début de la période, ou la première séance si elle est plus récente. */
  private resolveVolumeWindowStart(periodStart: Date, firstSessionAt: string | null | undefined): Date {
    const firstSession = firstSessionAt ? new Date(firstSessionAt) : null
    if (!firstSession || !Number.isFinite(firstSession.getTime())) return periodStart
    return firstSession > periodStart ? firstSession : periodStart
  }

  /** Relit la dernière séance terminée et, si elle existe, son analyse stockée. */
  private readLatestSession(row: Record<string, unknown> | undefined): LatestSession | null {
    if (!row) return null

    return {
      session_id: String(row.id),
      workout_name: typeof row.workout_name === 'string' ? row.workout_name : 'Séance',
      session_date: new Date(row.started_at as string).toISOString(),
      analysis: this.readAnalysis(row.ai_analysis),
    }
  }

  /**
   * Relit une analyse stockée.
   * Renvoie null dès qu'un champ attendu manque, plutôt qu'un objet à moitié vide,
   * ou quand le niveau ne fait pas partie de la liste actuelle (ancienne analyse).
   */
  private readAnalysis(raw: unknown): SessionAnalysis | null {
    if (!raw) return null

    let analysis: Record<string, unknown>
    try {
      analysis = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>)
    } catch {
      return null
    }

    const level = WodAnalysisSchema.shape.performance_level.safeParse(analysis?.performance_level)
    if (!level.success) return null

    return {
      summary: typeof analysis.summary === 'string' ? analysis.summary : '',
      performance_level: level.data,
      comparison: typeof analysis.comparison === 'string' ? analysis.comparison : null,
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.filter(s => typeof s === 'string') : [],
      improvements: Array.isArray(analysis.improvements)
        ? analysis.improvements.filter(s => typeof s === 'string')
        : [],
      next_steps: typeof analysis.next_steps === 'string' ? analysis.next_steps : '',
    }
  }

  /**
   * Durée d'effort d'une séance : le chrono saisi s'il existe, sinon l'écart entre début
   * et fin. Renvoie null quand aucune des deux sources n'est exploitable.
   */
  private resolveDurationSeconds(session: SessionRow): number | null {
    const elapsed = this.readNumber(session.results, 'elapsed_time_seconds')
    if (elapsed !== null && elapsed > 0) return elapsed

    if (!session.completed_at) return null
    const start = new Date(session.started_at).getTime()
    const end = new Date(session.completed_at).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null

    const seconds = (end - start) / 1000
    // Une séance de plus de 4 h relève presque toujours d'un chrono laissé tourner
    return seconds > 0 && seconds <= 4 * 3600 ? seconds : null
  }

  private readNumber(results: Record<string, unknown> | null, key: string): number | null {
    const value = results?.[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  }

  /**
   * Extrait les exercices structurés d'une séance, en ignorant l'ancien format texte libre.
   * @param sessionIndex Rang de la séance : regroupe les sections d'une même séance en une exposition
   */
  private readExerciseResults(results: Record<string, unknown> | null, sessionIndex: number): LoggedExercise[] {
    const raw = results?.exercise_results
    if (!Array.isArray(raw)) return []

    return raw.flatMap(item => {
      if (typeof item !== 'object' || item === null) return []
      const entry = item as Record<string, unknown>
      if (typeof entry.name !== 'string' || !entry.name.trim()) return []

      return [
        {
          name: entry.name,
          section_type: typeof entry.section_type === 'string' ? entry.section_type : undefined,
          session_index: sessionIndex,
          load_kg: typeof entry.load_kg === 'number' ? entry.load_kg : undefined,
          reps_completed: typeof entry.reps_completed === 'number' ? entry.reps_completed : undefined,
          scaled: entry.scaled === true,
        },
      ]
    })
  }
}
