import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { BenchmarkEntry, computeBenchmarkProgress } from './calculators/benchmark-progress'
import { computeEnergySystems } from './calculators/energy-systems'
import { computeMovementExposure, LoggedExercise } from './calculators/movement-exposure'
import { computeSkillProgress, SkillProgramRow, SkillStepRow } from './calculators/skill-progress'
import { computeStrengthHistory, OneRepMaxEntry } from './calculators/strength-history'
import { computeStrengthRatios } from './calculators/strength-ratios'
import { computeTrainingLoad } from './calculators/training-load'
import { computeTrainingVolume } from './calculators/training-volume'
import {
  BenchmarkProgress,
  EnergySystemsResult,
  LatestSessionAnalysis,
  MovementExposureResult,
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
  /** Relecture de la dernière analyse stockée — aucune génération IA déclenchée ici. */
  latest_analysis: LatestSessionAnalysis | null
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

    const [
      sessions,
      oneRepMaxRows,
      benchmarkRows,
      oneRepMaxHistoryRows,
      skillPrograms,
      skillSteps,
      latestAnalysisRow,
    ] = await Promise.all([
      this.knex('workout_sessions')
        .select('started_at', 'completed_at', 'results')
        .where('user_id', userId)
        .whereNotNull('completed_at')
        .where('started_at', '>=', sinceISO)
        .orderBy('started_at', 'asc') as Promise<SessionRow[]>,

      this.knex('one_rep_maxes').select('lift', 'value').where('user_id', userId),

      this.knex('benchmark_history')
        .select('workout_name', 'score_type', 'score_value', 'extra_reps', 'calculated_level', 'measured_at')
        .where('user_id', userId)
        .orderBy('measured_at', 'asc'),

      // Historique de force non borné à la période : une courbe de 1RM n'a de sens
      // que sur la durée, et les mesures sont trop espacées pour une fenêtre courte.
      this.knex('one_rep_max_history')
        .select('lift', 'value', 'measured_at')
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
          this.knex.raw("COALESCE(w.name, pw.plan_json->>'name') as workout_name"),
        )
        .where('ws.user_id', userId)
        .whereNotNull('ws.ai_analysis')
        .orderBy('ws.started_at', 'desc')
        .first(),
    ])

    const oneRepMaxes: Record<string, number> = {}
    for (const row of oneRepMaxRows) {
      const value = Number(row.value)
      if (Number.isFinite(value) && value > 0) oneRepMaxes[row.lift] = value
    }

    const benchmarkEntries: BenchmarkEntry[] = benchmarkRows.map(row => ({
      workout_name: row.workout_name,
      score_type: row.score_type,
      score_value: Number(row.score_value),
      extra_reps: row.extra_reps !== null ? Number(row.extra_reps) : null,
      calculated_level: row.calculated_level,
      measured_at: new Date(row.measured_at).toISOString(),
    }))

    const durations = sessions.map(session => ({
      started_at: new Date(session.started_at).toISOString(),
      duration_seconds: this.resolveDurationSeconds(session),
      rpe: this.readNumber(session.results, 'rpe'),
    }))

    const loggedExercises = sessions.flatMap(session => this.readExerciseResults(session.results))

    const strengthEntries: OneRepMaxEntry[] = oneRepMaxHistoryRows.map(row => ({
      lift: row.lift,
      value: Number(row.value),
      measured_at: new Date(row.measured_at).toISOString(),
    }))

    return {
      period_months: months,
      strength_ratios: computeStrengthRatios(oneRepMaxes),
      strength_history: computeStrengthHistory(strengthEntries),
      benchmarks: computeBenchmarkProgress(benchmarkEntries),
      energy_systems: computeEnergySystems(durations),
      volume: computeTrainingVolume(durations),
      load: computeTrainingLoad(durations),
      movements: computeMovementExposure(loggedExercises, oneRepMaxes),
      skills: computeSkillProgress(skillPrograms, skillSteps),
      latest_analysis: this.readLatestAnalysis(latestAnalysisRow),
      computed_at: new Date().toISOString(),
    }
  }

  /**
   * Relit l'analyse stockée de la dernière séance analysée.
   * Renvoie null dès qu'un champ attendu manque, plutôt qu'un objet à moitié vide.
   */
  private readLatestAnalysis(row: Record<string, unknown> | undefined): LatestSessionAnalysis | null {
    if (!row?.ai_analysis) return null

    let analysis: Record<string, unknown>
    try {
      analysis = typeof row.ai_analysis === 'string'
        ? JSON.parse(row.ai_analysis)
        : (row.ai_analysis as Record<string, unknown>)
    } catch {
      return null
    }

    if (typeof analysis?.performance_level !== 'string') return null

    return {
      session_id: String(row.id),
      workout_name: typeof row.workout_name === 'string' ? row.workout_name : 'Séance',
      session_date: new Date(row.started_at as string).toISOString(),
      summary: typeof analysis.summary === 'string' ? analysis.summary : '',
      performance_level: analysis.performance_level as LatestSessionAnalysis['performance_level'],
      comparison: typeof analysis.comparison === 'string' ? analysis.comparison : null,
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.filter(s => typeof s === 'string') : [],
      improvements: Array.isArray(analysis.improvements) ? analysis.improvements.filter(s => typeof s === 'string') : [],
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

  /** Extrait les exercices structurés d'une séance, en ignorant l'ancien format texte libre. */
  private readExerciseResults(results: Record<string, unknown> | null): LoggedExercise[] {
    const raw = results?.exercise_results
    if (!Array.isArray(raw)) return []

    return raw.flatMap(item => {
      if (typeof item !== 'object' || item === null) return []
      const entry = item as Record<string, unknown>
      if (typeof entry.name !== 'string' || !entry.name.trim()) return []

      return [{
        name: entry.name,
        load_kg: typeof entry.load_kg === 'number' ? entry.load_kg : undefined,
        reps_completed: typeof entry.reps_completed === 'number' ? entry.reps_completed : undefined,
        scaled: entry.scaled === true,
      }]
    })
  }
}
