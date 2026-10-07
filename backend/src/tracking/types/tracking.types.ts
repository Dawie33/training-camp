import { SessionResults } from 'src/workout-sessions/schemas/session-results.schema'
import { AIProgressionReport } from '../schemas/progression-report.schema'

export type SportType = 'crossfit'

export type ProgressionReport = AIProgressionReport & {
  sport: SportType
  period_months: number
  generated_at: string
}

/** `reused` n'est pas enregistré : il indique seulement si la réponse vient d'un bilan existant. */
export type GeneratedReport = ProgressionReport & { reused: boolean }

// ─── Lignes lues en base ──────────────────────────────────────────────────────
// Le driver pg renvoie les colonnes `decimal` en string (pour ne pas perdre de précision)
// et les colonnes timestamp en objet Date.

/** Ligne de `tracking_reports`. `report` est du jsonb, déjà décodé par pg dans la plupart des cas. */
export interface TrackingReportRow {
  sport: SportType
  period_months: number
  report: ProgressionReport | string
  generated_at: Date
}

/** Séance terminée jointe à son workout (`leftJoin` : les champs du workout peuvent être null). */
export interface CrossfitSessionRow {
  started_at: Date
  completed_at: Date
  results: SessionResults | null
  workout_name: string | null
  workout_type: string | null
}

/** 1RM actuel (`one_rep_maxes`). */
export interface OneRepMaxRow {
  lift: string
  value: string
}

/** Mesure de 1RM sur la période (`one_rep_max_history`). */
export interface OneRepMaxHistoryRow {
  lift: string
  value: string
  measured_at: Date
}

/** Test de benchmark sur la période (`benchmark_history`). */
export interface BenchmarkHistoryRow {
  workout_name: string
  score_type: string
  score_value: string
  calculated_level: string
  measured_at: Date
}

/** Extrait du profil (`users`) utile au prompt. `global_goals` : ex. { strength: true, endurance: false }. */
export interface TrackingProfileRow {
  sport_level: string | null
  global_goals: Record<string, boolean> | null
}

// ─── Agrégat transmis au prompt ───────────────────────────────────────────────

export interface CrossfitAggregate {
  total: number
  /** Déjà formaté avec une décimale (ex. "2.5"). */
  avgPerWeek: string
  weekSpan: number
  consistencyPct: number
  typeStats: { type: string; count: number }[]
  namedWorkouts: { name: string; date: string; type: string | null; result: string }[]
  ormProgression: { lift: string; start: number; end: number; gain: number }[]
  benchmarkProgression: { name: string; count: number; firstLevel: string; lastLevel: string; lastScore: string }[]
}
