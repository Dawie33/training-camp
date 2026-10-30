import { apiClient } from './apiClient'

// Types recopiés à la main : à garder synchronisés avec backend/src/analytics/types/analytics.types.ts.
// Toute évolution de la réponse de GET /analytics/overview doit être reportée ici,
// aucun contrôle automatique ne détecte un écart entre les deux fichiers.

export type RatioVerdict = 'below' | 'in_range' | 'above' | 'unavailable'

export interface StrengthRatio {
  key: string
  label: string
  value_pct: number | null
  target_min_pct: number
  target_max_pct: number
  verdict: RatioVerdict
  interpretation: string
  /** Au moins un des deux 1RM est estimé : le verdict est à confirmer par un test. */
  based_on_estimate: boolean
}

export interface StrengthRatiosResult {
  ratios: StrengthRatio[]
  missing_lifts: string[]
}

export type EnergyDomain = 'power' | 'glycolytic' | 'mixed' | 'aerobic' | 'long_aerobic'

export interface EnergyDomainStat {
  domain: EnergyDomain
  label: string
  range_label: string
  session_count: number
  share_pct: number
}

export interface EnergySystemsResult {
  total_scored_sessions: number
  domains: EnergyDomainStat[]
  underworked: EnergyDomain[]
}

export interface BenchmarkPoint {
  score_value: number
  extra_reps: number | null
  /** Valeur comparée d'un test à l'autre : les reps d'un AMRAP y comptent en fraction de round. */
  comparable_value: number
  level: string
  measured_at: string
  display: string
}

export interface BenchmarkBand {
  level: string
  threshold: number
  display: string
}

export interface BenchmarkProgress {
  /** Clé de la série : deux workouts homonymes restent deux séries. */
  workout_id: string
  name: string
  score_type: string
  lower_is_better: boolean
  points: BenchmarkPoint[]
  delta_pct: number | null
  trend: 'improving' | 'stable' | 'declining'
  bands: BenchmarkBand[] | null
}

export interface WeeklyVolumePoint {
  week_start: string
  session_count: number
}

export interface TrainingVolumeResult {
  total_sessions: number
  week_span: number
  avg_per_week: number
  consistency_pct: number
  weeks: WeeklyVolumePoint[]
}

export type AcwrZone = 'undertrained' | 'optimal' | 'caution' | 'high_risk'

export interface WeeklyLoadPoint {
  week_start: string
  srpe: number
  session_count: number
}

export interface TrainingLoadResult {
  available: boolean
  sessions_with_rpe: number
  weeks: WeeklyLoadPoint[]
  acute: number | null
  chronic: number | null
  acwr: number | null
  acwr_zone: AcwrZone | null
  last_week_change_pct: number | null
}

/** Origine des charges d'un mouvement : les sections de force si le mouvement y figure, sinon le metcon. */
export type LoadSource = 'strength' | 'metcon'

export interface MovementExposure {
  name: string
  exposures: number
  total_reps: number
  scaled_count: number
  scaled_pct: number
  avg_load_kg: number | null
  max_load_kg: number | null
  pct_of_1rm: number | null
  load_source: LoadSource | null
}

export interface MovementExposureResult {
  available: boolean
  movements: MovementExposure[]
  most_scaled: string[]
}

export interface StrengthHistoryPoint {
  value: number
  measured_at: string
  /** 1RM estimé depuis une série de plusieurs reps, et non testé. */
  estimated: boolean
}

export interface StrengthLiftHistory {
  lift: string
  points: StrengthHistoryPoint[]
  current: number
  current_estimated: boolean
  best: number
  /** Gain entre relevés de même nature que le 1RM actuel (estimés entre eux, réels entre eux). */
  gain_kg: number | null
  gain_pct: number | null
  trend: 'improving' | 'stable' | 'declining'
}

export interface StrengthHistoryResult {
  available: boolean
  lifts: StrengthLiftHistory[]
}

export type PerformanceLevel = 'pr' | 'above_average' | 'average' | 'below_average' | 'first_time'

export interface SessionAnalysis {
  summary: string
  performance_level: PerformanceLevel
  comparison: string | null
  strengths: string[]
  improvements: string[]
  next_steps: string
}

/** Dernière séance terminée — `analysis` vaut null tant qu'elle n'a pas été analysée. */
export interface LatestSession {
  session_id: string
  workout_name: string
  session_date: string
  analysis: SessionAnalysis | null
}

export interface SkillProgress {
  program_id: string
  skill_name: string
  skill_category: string
  current_step_title: string | null
  completed_steps: number
  total_steps: number
  progress_pct: number
}

export interface SkillProgressResult {
  available: boolean
  skills: SkillProgress[]
}

export interface RunningZoneShare {
  zone: number
  label: string
  share_pct: number
}

export interface RunSegmentAnalysis {
  session_date: string
  /** `stations` : fichiers de course séparés par d'autres activités (Hyrox) ; `laps` : tours d'un même fichier */
  kind: 'stations' | 'laps'
  paces_min_km: number[]
  spread_pct: number
  drift_pct: number | null
}

export interface RunningResult {
  available: boolean
  total_runs: number
  total_distance_km: number
  last_28_days_km: number
  previous_28_days_km: number
  recent_pace_min_km: number | null
  previous_pace_min_km: number | null
  /** Positif = plus lent */
  pace_change_pct: number | null
  zones: RunningZoneShare[] | null
  segments: RunSegmentAnalysis[]
}

export interface PerformanceOverview {
  period_months: number
  strength_ratios: StrengthRatiosResult
  strength_history: StrengthHistoryResult
  benchmarks: BenchmarkProgress[]
  energy_systems: EnergySystemsResult
  volume: TrainingVolumeResult
  load: TrainingLoadResult
  movements: MovementExposureResult
  skills: SkillProgressResult
  running: RunningResult
  latest_session: LatestSession | null
  computed_at: string
}

/**
 * Client du diagnostic de performance calculé (aucun appel IA côté backend).
 */
class AnalyticsService {
  async getOverview(months = 3): Promise<PerformanceOverview> {
    return apiClient.get<PerformanceOverview>(`/analytics/overview?months=${months}`)
  }
}

export const analyticsService = new AnalyticsService()
