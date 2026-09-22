import { BENCHMARK_STANDARDS } from '../../workouts/workout.utils'
import { BenchmarkBand, BenchmarkPoint, BenchmarkProgress } from '../types/analytics.types'

export interface BenchmarkEntry {
  workout_name: string
  score_type: string
  score_value: number
  extra_reps: number | null
  calculated_level: string
  measured_at: string
}

/** Variation en deçà de laquelle on parle de stabilité plutôt que de progrès ou de régression. */
const TREND_THRESHOLD_PCT = 3

const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced', 'elite'] as const

/** Formate un score selon sa nature, pour l'affichage. */
export function formatScore(scoreType: string, value: number, extraReps?: number | null): string {
  if (scoreType === 'time_seconds') {
    const minutes = Math.floor(value / 60)
    const seconds = Math.round(value % 60)
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }
  if (scoreType === 'rounds') return extraReps ? `${value} rounds + ${extraReps}` : `${value} rounds`
  if (scoreType === 'weight') return `${value} kg`
  return String(value)
}

/** Construit les bandes de niveau d'un benchmark, pour situer une courbe sur une échelle. */
function buildBands(workoutName: string, scoreType: string): BenchmarkBand[] | null {
  const standard = BENCHMARK_STANDARDS[workoutName]
  if (!standard) return null
  // Le barème « beginner » est une borne ouverte (999999) : elle n'a pas de sens à l'affichage.
  return LEVEL_ORDER
    .filter(level => level !== 'beginner')
    .map(level => ({
      level,
      threshold: standard[level],
      display: formatScore(scoreType, standard[level]),
    }))
}

/**
 * Construit la progression par benchmark : série temporelle, variation et tendance.
 *
 * Seule comparaison valide en CrossFit : le même workout contre lui-même. On ne compare
 * jamais deux WODs différents au prétexte qu'ils partagent un format.
 *
 * @param entries Historique des résultats de benchmark, tous workouts confondus
 * @returns Une progression par workout, les plus récemment testés d'abord
 */
export function computeBenchmarkProgress(entries: BenchmarkEntry[]): BenchmarkProgress[] {
  const byWorkout = new Map<string, BenchmarkEntry[]>()
  for (const entry of entries) {
    const bucket = byWorkout.get(entry.workout_name)
    if (bucket) bucket.push(entry)
    else byWorkout.set(entry.workout_name, [entry])
  }

  const progressions: BenchmarkProgress[] = []

  for (const [name, rows] of byWorkout) {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
    )

    const scoreType = sorted[0].score_type
    const lowerIsBetter = scoreType === 'time_seconds'

    const points: BenchmarkPoint[] = sorted.map(row => ({
      score_value: row.score_value,
      extra_reps: row.extra_reps,
      level: row.calculated_level,
      measured_at: row.measured_at,
      display: formatScore(row.score_type, row.score_value, row.extra_reps),
    }))

    let deltaPct: number | null = null
    let trend: BenchmarkProgress['trend'] = 'stable'

    if (points.length >= 2) {
      const first = points[0].score_value
      const last = points[points.length - 1].score_value
      if (first > 0) {
        const raw = lowerIsBetter ? ((first - last) / first) * 100 : ((last - first) / first) * 100
        deltaPct = Math.round(raw * 10) / 10
        if (deltaPct > TREND_THRESHOLD_PCT) trend = 'improving'
        else if (deltaPct < -TREND_THRESHOLD_PCT) trend = 'declining'
      }
    }

    progressions.push({
      name,
      score_type: scoreType,
      lower_is_better: lowerIsBetter,
      points,
      delta_pct: deltaPct,
      trend,
      bands: buildBands(name, scoreType),
    })
  }

  return progressions.sort((a, b) => {
    const aLast = new Date(a.points[a.points.length - 1].measured_at).getTime()
    const bLast = new Date(b.points[b.points.length - 1].measured_at).getTime()
    return bLast - aLast
  })
}
