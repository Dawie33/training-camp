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
  /** Part des semaines de la période où au moins une séance a été enregistrée. */
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
  /** false tant qu'aucune séance ne porte de RPE — l'écran affiche alors une invitation, pas un zéro. */
  available: boolean
  sessions_with_rpe: number
  weeks: WeeklyLoadPoint[]
  acute: number | null
  chronic: number | null
  acwr: number | null
  acwr_zone: AcwrZone | null
  last_week_change_pct: number | null
}

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
}

export interface MovementExposureResult {
  available: boolean
  movements: MovementExposure[]
  /** Mouvements scalés sur au moins la moitié de leurs expositions. */
  most_scaled: string[]
}
