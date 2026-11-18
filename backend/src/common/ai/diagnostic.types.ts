import type { RunTypeCounts } from 'src/analytics/types/analytics.types'

/** Ratio de force sorti de sa fourchette cible, dans un sens ou dans l'autre. */
export interface RatioImbalance {
  label: string
  value_pct: number
  target: string
  direction: 'below' | 'above'
  reading: string
  /** Ratio calculé sur au moins un 1RM estimé : à confirmer par un test avant d'en faire un axe de travail. */
  estimated: boolean
}

/**
 * Synthèse du diagnostic calculé, sous une forme assez compacte pour tenir dans un prompt.
 *
 * On n'y met que ce qui oriente une décision de programmation : les écarts, les manques
 * et les alertes. Les séries complètes restent dans le module analytics.
 */
export interface PerformanceDiagnosticSummary {
  /**
   * Ratios de force hors fourchette, avec la lecture coach de l'écart. Un ratio trop haut
   * compte autant qu'un trop bas : il désigne le mouvement du dénominateur comme limitant.
   */
  ratio_imbalances: RatioImbalance[]
  /** Domaines temporels sous 10 % du volume — un athlète ne progresse que là où il s'expose. */
  underworked_domains: string[]
  load_zone: string | null
  load_change_pct: number | null
  /** Mouvements scalés plus d'une fois sur deux : points faibles techniques probables. */
  most_scaled_movements: string[]
  benchmark_trends: { name: string; trend: string; delta_pct: number | null }[]
  sessions_per_week: number
  consistency_pct: number
  /** Course à pied lue dans les fichiers .fit, null quand aucune course n'a été importée sur la période. */
  running: RunningDiagnostic | null
}

/** Synthèse course à pied du diagnostic, réduite à ce qui oriente la programmation. */
export interface RunningDiagnostic {
  last_28_days_km: number
  previous_28_days_km: number
  /** Séances de course des 28 derniers jours par type : continue, fractionné, à stations. */
  run_types: RunTypeCounts
  /** Allure moyenne des sorties continues seulement. */
  recent_pace_min_km: number | null
  /** Positif = plus lent que sur les 28 jours d'avant. */
  pace_change_pct: number | null
  /** Part du temps de course en zones 1-2 (facile) et 4-5 (intense), null sans zones cardiaques. */
  easy_zone_pct: number | null
  hard_zone_pct: number | null
  /**
   * Dernière séance à stations (format Hyrox) : écart entre le segment de course le plus rapide et le plus lent,
   * et dérive du premier au dernier quand l'ordre des segments est connu.
   */
  latest_stations: { segment_count: number; spread_pct: number; drift_pct: number | null } | null
  /** Dernière sortie découpée en tours : dérive d'allure du premier au dernier tour d'effort. */
  latest_laps: { segment_count: number; drift_pct: number } | null
  /** Dernière simulation Hyrox de chaque format, comparée à la précédente du même format. */
  hyrox_simulations: {
    format: string
    count: number
    total_seconds: number
    run_share_pct: number
    run_drift_pct: number | null
    /** Négatif = plus rapide que la simulation précédente du même format. */
    delta_pct: number | null
  }[]
}
