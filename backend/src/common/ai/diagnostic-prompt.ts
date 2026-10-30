import {
  PerformanceDiagnosticSummary,
  RatioImbalance,
  RunningDiagnostic,
} from 'src/workouts/services/user-context.service'

const DIRECTION_LABELS: Record<RatioImbalance['direction'], string> = {
  below: 'trop bas',
  above: 'trop haut',
}

const TREND_LABELS: Record<string, string> = {
  improving: '↑ progression',
  declining: '↓ régression',
  stable: '→ stable',
}

const LOAD_ZONE_LABELS: Record<string, string> = {
  undertrained: 'charge basse (marge pour monter)',
  optimal: 'zone optimale',
  caution: 'vigilance — la charge monte vite',
  high_risk: 'hausse rapide de charge — stabiliser, ne plus augmenter',
}

/**
 * Met en forme les déséquilibres de force, une ligne par ratio, avec le sens de l'écart :
 * c'est lui qui dit quel mouvement est limitant.
 *
 * @param imbalances Ratios hors fourchette issus du diagnostic
 * @returns Les lignes à insérer dans le prompt
 */
export function formatRatioImbalances(imbalances: RatioImbalance[]): string[] {
  return imbalances.map(
    ratio =>
      `- ${ratio.label} : ${ratio.value_pct} %, ${DIRECTION_LABELS[ratio.direction]} (cible ${ratio.target}) — ${ratio.reading}` +
      (ratio.estimated ? ' (1RM estimé — à confirmer par un test)' : '')
  )
}

/** Allure en min/km au format montre (5,17 → « 5:10 »). */
export function formatPace(paceMinKm: number): string {
  const totalSeconds = Math.round(paceMinKm * 60)
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`

/**
 * Met en forme le bloc course à pied. Une allure qui augmente est plus lente : le sens est
 * écrit en toutes lettres pour que le modèle ne lise pas « +5 % » comme une progression.
 *
 * @param running Synthèse course issue du diagnostic
 * @returns Les lignes à insérer dans le prompt
 */
export function formatRunningLines(running: RunningDiagnostic): string[] {
  const lines = [
    `- Volume : ${running.last_28_days_km} km sur les 28 derniers jours (${running.previous_28_days_km} km les 28 jours d’avant)`,
  ]

  if (running.recent_pace_min_km !== null) {
    const change =
      running.pace_change_pct !== null
        ? `, ${signed(running.pace_change_pct)} % vs les 28 jours d’avant (${running.pace_change_pct > 0 ? 'plus lent' : running.pace_change_pct < 0 ? 'plus rapide' : 'stable'})`
        : ''
    lines.push(`- Allure moyenne sur 28 jours : ${formatPace(running.recent_pace_min_km)} /km${change}`)
  }

  if (running.easy_zone_pct !== null && running.hard_zone_pct !== null) {
    lines.push(
      `- Temps de course par zone cardiaque : ${running.easy_zone_pct} % en zones 1-2 (facile), ${running.hard_zone_pct} % en zones 4-5 (intense)`
    )
  }

  if (running.latest_stations) {
    lines.push(
      `- Dernière séance à stations (format Hyrox, ${running.latest_stations.segment_count} segments de course) : ${running.latest_stations.spread_pct} % d’écart d’allure entre le segment le plus rapide et le plus lent`
    )
  }

  if (running.latest_laps) {
    lines.push(
      `- Dernière sortie découpée (${running.latest_laps.segment_count} tours d’effort) : allure ${signed(running.latest_laps.drift_pct)} % du premier au dernier tour (positif = ralentissement)`
    )
  }

  return lines
}

/**
 * Met en forme le diagnostic calculé pour un prompt.
 *
 * Ces chiffres sont **mesurés**, pas estimés : le modèle doit s'appuyer dessus et ne
 * jamais les recalculer ni les contredire. Renvoie un tableau vide quand rien n'est
 * exploitable, pour ne pas encombrer le prompt de sections creuses.
 *
 * @param diagnostic Synthèse issue du module analytics
 * @returns Les lignes à insérer dans le prompt
 */
export function buildDiagnosticPromptLines(diagnostic?: PerformanceDiagnosticSummary): string[] {
  if (!diagnostic) return []

  const lines: string[] = []

  if (diagnostic.ratio_imbalances.length > 0) {
    lines.push('### Déséquilibres de force mesurés')
    lines.push(...formatRatioImbalances(diagnostic.ratio_imbalances))
  }

  if (diagnostic.underworked_domains.length > 0) {
    lines.push('### Filières délaissées (moins de 10 % du volume)')
    lines.push(`- ${diagnostic.underworked_domains.join(', ')}`)
  }

  if (diagnostic.most_scaled_movements.length > 0) {
    lines.push('### Mouvements scalés plus d’une fois sur deux')
    lines.push(`- ${diagnostic.most_scaled_movements.join(', ')}`)
  }

  if (diagnostic.load_zone) {
    const change =
      diagnostic.load_change_pct !== null
        ? `, variation ${diagnostic.load_change_pct > 0 ? '+' : ''}${diagnostic.load_change_pct} % (dernière semaine complète vs la précédente)`
        : ''
    lines.push('### Charge d’entraînement')
    lines.push(`- ${LOAD_ZONE_LABELS[diagnostic.load_zone] ?? diagnostic.load_zone}${change}`)
  }

  if (diagnostic.benchmark_trends.length > 0) {
    lines.push('### Benchmarks (chacun comparé à lui-même)')
    for (const benchmark of diagnostic.benchmark_trends) {
      const delta =
        benchmark.delta_pct !== null ? ` (${benchmark.delta_pct > 0 ? '+' : ''}${benchmark.delta_pct} %)` : ''
      lines.push(`- ${benchmark.name} : ${TREND_LABELS[benchmark.trend] ?? benchmark.trend}${delta}`)
    }
  }

  if (diagnostic.running) {
    lines.push('### Course à pied (fichiers .fit)')
    lines.push(...formatRunningLines(diagnostic.running))
  }

  if (lines.length === 0) return []

  return ['', '## DIAGNOSTIC CALCULÉ (chiffres mesurés — ne pas les recalculer ni les contredire)', ...lines]
}
