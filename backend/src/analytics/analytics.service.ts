import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { BenchmarkEntry, computeBenchmarkProgress } from './calculators/benchmark-progress'
import { computeEnergySystems } from './calculators/energy-systems'
import { computeMovementExposure, LoggedExercise } from './calculators/movement-exposure'
import { computeStrengthRatios } from './calculators/strength-ratios'
import { computeTrainingLoad } from './calculators/training-load'
import { computeTrainingVolume } from './calculators/training-volume'
import {
  BenchmarkProgress,
  EnergySystemsResult,
  MovementExposureResult,
  StrengthRatiosResult,
  TrainingLoadResult,
  TrainingVolumeResult,
} from './types/analytics.types'

export interface PerformanceOverview {
  period_months: number
  strength_ratios: StrengthRatiosResult
  benchmarks: BenchmarkProgress[]
  energy_systems: EnergySystemsResult
  volume: TrainingVolumeResult
  load: TrainingLoadResult
  movements: MovementExposureResult
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

    const [sessions, oneRepMaxRows, benchmarkRows] = await Promise.all([
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

    return {
      period_months: months,
      strength_ratios: computeStrengthRatios(oneRepMaxes),
      benchmarks: computeBenchmarkProgress(benchmarkEntries),
      energy_systems: computeEnergySystems(durations),
      volume: computeTrainingVolume(durations),
      load: computeTrainingLoad(durations),
      movements: computeMovementExposure(loggedExercises, oneRepMaxes),
      computed_at: new Date().toISOString(),
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
