import { PerformanceDiagnosticSummary, RatioImbalance } from 'src/workouts/services/user-context.service'

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
  high_risk: 'RISQUE ÉLEVÉ — réduire le volume',
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
      `- ${ratio.label} : ${ratio.value_pct} %, ${DIRECTION_LABELS[ratio.direction]} (cible ${ratio.target}) — ${ratio.reading}`
  )
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
        ? `, variation ${diagnostic.load_change_pct > 0 ? '+' : ''}${diagnostic.load_change_pct} % vs semaine passée`
        : ''
    lines.push('### Charge d’entraînement')
    lines.push(`- ${LOAD_ZONE_LABELS[diagnostic.load_zone] ?? diagnostic.load_zone}${change}`)
  }

  if (diagnostic.benchmark_trends.length > 0) {
    lines.push('### Benchmarks (chacun comparé à lui-même)')
    for (const benchmark of diagnostic.benchmark_trends) {
      const delta = benchmark.delta_pct !== null ? ` (${benchmark.delta_pct > 0 ? '+' : ''}${benchmark.delta_pct} %)` : ''
      lines.push(`- ${benchmark.name} : ${TREND_LABELS[benchmark.trend] ?? benchmark.trend}${delta}`)
    }
  }

  if (lines.length === 0) return []

  return [
    '',
    '## DIAGNOSTIC CALCULÉ (chiffres mesurés — ne pas les recalculer ni les contredire)',
    ...lines,
  ]
}
