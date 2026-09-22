import { StrengthHistoryResult, StrengthLiftHistory } from '../types/analytics.types'

export interface OneRepMaxEntry {
  lift: string
  value: number
  measured_at: string
}

/** Variation en deçà de laquelle on ne parle ni de gain ni de perte. */
const TREND_THRESHOLD_KG = 0.5

/**
 * Évolution des 1RM par mouvement, pour les petits multiples du dashboard.
 *
 * Chaque lift est une série indépendante : on ne les compare jamais entre eux,
 * un back squat et un strict press n'ont pas le même ordre de grandeur.
 *
 * @param entries Historique brut, tous lifts confondus
 * @returns Une série par lift ayant au moins un point, du plus lourd au plus léger
 */
export function computeStrengthHistory(entries: OneRepMaxEntry[]): StrengthHistoryResult {
  const byLift = new Map<string, OneRepMaxEntry[]>()
  for (const entry of entries) {
    const value = Number(entry.value)
    if (!Number.isFinite(value) || value <= 0) continue
    const bucket = byLift.get(entry.lift)
    if (bucket) bucket.push({ ...entry, value })
    else byLift.set(entry.lift, [{ ...entry, value }])
  }

  const lifts: StrengthLiftHistory[] = [...byLift.entries()].map(([lift, rows]) => {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
    )

    const points = sorted.map(row => ({
      value: row.value,
      measured_at: new Date(row.measured_at).toISOString(),
    }))

    const first = points[0].value
    const last = points[points.length - 1].value
    const gainKg = Math.round((last - first) * 10) / 10

    let trend: StrengthLiftHistory['trend'] = 'stable'
    if (points.length >= 2) {
      if (gainKg > TREND_THRESHOLD_KG) trend = 'improving'
      else if (gainKg < -TREND_THRESHOLD_KG) trend = 'declining'
    }

    return {
      lift,
      points,
      current: last,
      best: Math.max(...points.map(p => p.value)),
      gain_kg: points.length >= 2 ? gainKg : null,
      gain_pct: points.length >= 2 && first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : null,
      trend,
    }
  })

  lifts.sort((a, b) => b.current - a.current)

  return { available: lifts.length > 0, lifts }
}
