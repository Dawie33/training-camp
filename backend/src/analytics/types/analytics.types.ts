import type { WodAnalysis } from '../../workout-sessions/schemas/wod-analysis.schema'

/** Verdict d'un ratio diagnostique par rapport à sa fourchette de référence. */
export type RatioVerdict = 'below' | 'in_range' | 'above' | 'unavailable'

export interface StrengthRatio {
  key: string
  label: string
  /** Valeur du ratio en pourcentage, null si l'un des deux 1RM manque. */
  value_pct: number | null
  target_min_pct: number
  target_max_pct: number
  verdict: RatioVerdict
  /** Lecture coach du verdict : ce que l'écart révèle et sur quoi travailler. */
  interpretation: string
  /** Au moins un des deux 1RM est estimé : le verdict est à confirmer par un test. */
  based_on_estimate: boolean
}

export interface StrengthRatiosResult {
  ratios: StrengthRatio[]
  /** Lifts absents du profil qui empêchent de calculer au moins un ratio. */
  missing_lifts: string[]
}

/** Domaine temporel d'un effort, qui détermine la filière énergétique sollicitée. */
export type EnergyDomain = 'power' | 'glycolytic' | 'mixed' | 'aerobic' | 'long_aerobic'

export interface EnergyDomainStat {
  domain: EnergyDomain
  label: string
  range_label: string
  session_count: number
  share_pct: number
}

export interface EnergySystemsResult {
  /** Séances dont la durée est exploitable — les autres sont ignorées, pas comptées comme zéro. */
  total_scored_sessions: number
  domains: EnergyDomainStat[]
  /** Domaines sous 10 % de la répartition : un athlète ne progresse que là où il travaille. */
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
  /** Nom du résultat le plus récent, pour l'affichage. */
  name: string
  score_type: string
  lower_is_better: boolean
  points: BenchmarkPoint[]
  delta_pct: number | null
  trend: 'improving' | 'stable' | 'declining'
  /** Seuils de niveau du benchmark, pour situer la courbe. Null si le workout n'a pas de barème connu. */
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
  /**
   * Part des semaines entraînées, du début de la fenêtre (période ou première séance) à la
   * semaine en cours, celle-ci n'étant comptée qu'une fois entamée.
   */
  consistency_pct: number
  /** Toutes les semaines de la fenêtre, semaines sans séance comprises (à 0). */
  weeks: WeeklyVolumePoint[]
}

export type AcwrZone = 'undertrained' | 'optimal' | 'caution' | 'high_risk'

export interface WeeklyLoadPoint {
  week_start: string
  srpe: number
  session_count: number
}

export interface TrainingLoadResult {
  /** false tant qu'aucune séance ne porte de RPE — l'écran affiche alors une invitation, pas un zéro. */
  available: boolean
  sessions_with_rpe: number
  /** Toutes les semaines depuis la première séance notée, semaines sans séance comprises (à 0). */
  weeks: WeeklyLoadPoint[]
  acute: number | null
  chronic: number | null
  acwr: number | null
  acwr_zone: AcwrZone | null
  /** Dernière semaine complète contre la précédente. Null quand la précédente n'a aucune charge. */
  last_week_change_pct: number | null
}

/** Origine des charges d'un mouvement : jamais un mélange des deux. */
export type LoadSource = 'strength' | 'metcon'

export interface MovementExposure {
  name: string
  exposures: number
  total_reps: number
  scaled_count: number
  scaled_pct: number
  avg_load_kg: number | null
  max_load_kg: number | null
  /** Charge moyenne rapportée au 1RM du mouvement, quand le lift correspondant est renseigné. */
  pct_of_1rm: number | null
  /** Sections d'où viennent les charges : la force quand le mouvement y figure, sinon le metcon. */
  load_source: LoadSource | null
}

export interface MovementExposureResult {
  available: boolean
  movements: MovementExposure[]
  /** Mouvements scalés sur au moins la moitié de leurs expositions. */
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

/** Niveaux définis par le schéma de l'analyse post-séance, seule source de la liste. */
export type PerformanceLevel = WodAnalysis['performance_level']

/** Analyse IA d'une séance, telle que stockée par `WorkoutAnalysisService`. */
export interface SessionAnalysis {
  summary: string
  performance_level: PerformanceLevel
  comparison: string | null
  strengths: string[]
  improvements: string[]
  next_steps: string
}

/**
 * Dernière séance terminée, avec son analyse si elle a été générée.
 *
 * Contrairement au reste du module, l'analyse n'est pas calculée : elle **relit** ce
 * que `WorkoutAnalysisService` a stocké. Aucun appel à l'IA n'est déclenché ici —
 * `analysis` vaut null tant que l'athlète n'a pas demandé l'analyse de la séance.
 */
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
  /** Étape en cours, null quand le programme n'en a aucune d'ouverte. */
  current_step_title: string | null
  completed_steps: number
  total_steps: number
  progress_pct: number
}

export interface SkillProgressResult {
  available: boolean
  skills: SkillProgress[]
}

/** Part du temps de course passée dans une zone cardiaque, tous fichiers .fit confondus. */
export interface RunningZoneShare {
  zone: number
  label: string
  share_pct: number
}

/**
 * Allures des segments de course d'une même séance.
 * - `stations` : plusieurs fichiers de course séparés par d'autres activités (format Hyrox). Leur ordre
 *   n'est pas enregistré, on ne mesure donc que l'écart entre le segment le plus rapide et le plus lent.
 * - `laps` : tours d'un seul fichier de course, dans l'ordre : on mesure aussi la dérive du premier au dernier.
 */
export interface RunSegmentAnalysis {
  session_date: string
  kind: 'stations' | 'laps'
  /** Allures des segments en min/km, dans l'ordre enregistré. */
  paces_min_km: number[]
  /** Écart entre le segment le plus lent et le plus rapide, en % de l'allure la plus rapide. */
  spread_pct: number
  /** Du premier au dernier tour, en % (positif = plus lent à la fin). Null pour `stations`. */
  drift_pct: number | null
}

export interface RunningResult {
  /** Au moins une activité de course importée depuis un .fit sur la période. */
  available: boolean
  total_runs: number
  total_distance_km: number
  /** Kilomètres courus sur les 28 derniers jours, puis sur les 28 jours d'avant. */
  last_28_days_km: number
  previous_28_days_km: number
  /** Allure moyenne pondérée par la distance, en min/km, sur chaque fenêtre de 28 jours (null sous 2 sorties). */
  recent_pace_min_km: number | null
  previous_pace_min_km: number | null
  /** Évolution de l'allure, en % (positif = plus lent). Null si l'une des deux fenêtres manque. */
  pace_change_pct: number | null
  /** Répartition du temps de course par zone cardiaque, null si aucun fichier ne porte de zones. */
  zones: RunningZoneShare[] | null
  /** Séances découpées en segments, de la plus récente à la plus ancienne (5 au plus). */
  segments: RunSegmentAnalysis[]
}
