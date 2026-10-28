import { BENCHMARK_STANDARDS, BenchmarkStandard } from '../../workouts/workout.utils'
import { BenchmarkBand, BenchmarkPoint, BenchmarkProgress } from '../types/analytics.types'

export interface BenchmarkEntry {
  workout_id: string
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

/** Seuil « sans limite » des barèmes au temps : n'importe quel temps est au moins débutant. */
const OPEN_ENDED_THRESHOLD = 999999

/**
 * Reps par round retenues pour un AMRAP sans barème : la taille réelle d'un round est inconnue.
 * Même règle que `calculateLevelFromBenchmarks`, pour rester cohérent avec le niveau calculé.
 */
const DEFAULT_REPS_PER_ROUND = 100

/** Type de score enregistré pour chaque métrique de barème (voir `saveBenchmarkResult`). */
const SCORE_TYPE_BY_METRIC: Record<BenchmarkStandard['metric'], string> = {
  time: 'time_seconds',
  rounds: 'rounds',
  distance: 'rounds',
  weight: 'weight',
  power: 'weight',
}

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
  // Une borne ouverte (999999, WOD au temps) n'a pas de sens à l'affichage ; celle de Cindy (8 rounds) en a un.
  return LEVEL_ORDER.filter(level => standard[level] < OPEN_ENDED_THRESHOLD).map(level => ({
    level,
    threshold: standard[level],
    display: formatScore(scoreType, standard[level]),
  }))
}

/**
 * Type de score de référence d'une série : celui du barème quand le benchmark en a un,
 * sinon le plus fréquent (à égalité, celui du résultat le plus récent).
 */
function resolveScoreType(sorted: BenchmarkEntry[], standard: BenchmarkStandard | undefined): string {
  if (standard) return SCORE_TYPE_BY_METRIC[standard.metric]

  const counts = new Map<string, number>()
  for (const row of sorted) counts.set(row.score_type, (counts.get(row.score_type) ?? 0) + 1)
  let best = sorted[sorted.length - 1].score_type
  for (const [type, count] of counts) {
    if (count > (counts.get(best) ?? 0)) best = type
  }
  return best
}

/**
 * Valeur comparable d'un score : pour un AMRAP, les reps supplémentaires deviennent une
 * fraction de round (« 15 rounds + 14 » sur Cindy vaut 15,47), sinon elles ne compteraient pas.
 */
function comparableValue(row: BenchmarkEntry, repsPerRound: number): number {
  if (row.score_type !== 'rounds' || !row.extra_reps) return row.score_value
  return row.score_value + row.extra_reps / repsPerRound
}

/**
 * Construit la progression par benchmark : série temporelle, variation et tendance.
 *
 * Seule comparaison valide en CrossFit : le même workout contre lui-même. On ne compare
 * jamais deux WODs différents au prétexte qu'ils partagent un format. Les séries sont donc
 * regroupées par workout_id (le nom, saisi côté client, peut varier ou être partagé), et
 * un score d'un autre type que celui de la série (des rounds sur Fran) en est exclu.
 *
 * @param entries Historique des résultats de benchmark, tous workouts confondus
 * @returns Une progression par workout, les plus récemment testés d'abord
 */
export function computeBenchmarkProgress(entries: BenchmarkEntry[]): BenchmarkProgress[] {
  const byWorkout = new Map<string, BenchmarkEntry[]>()
  for (const entry of entries) {
    const bucket = byWorkout.get(entry.workout_id)
    if (bucket) bucket.push(entry)
    else byWorkout.set(entry.workout_id, [entry])
  }

  const progressions: BenchmarkProgress[] = []

  for (const [workoutId, rows] of byWorkout) {
    const sorted = [...rows].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())

    // Le nom affiché est le plus récent : une faute de frappe ancienne ne reste pas à l'écran
    const name = sorted[sorted.length - 1].workout_name
    const standard = BENCHMARK_STANDARDS[name]
    const scoreType = resolveScoreType(sorted, standard)
    const lowerIsBetter = scoreType === 'time_seconds'
    const repsPerRound = standard?.repsPerRound ?? DEFAULT_REPS_PER_ROUND

    const points: BenchmarkPoint[] = sorted
      .filter(row => row.score_type === scoreType)
      .map(row => ({
        score_value: row.score_value,
        extra_reps: row.extra_reps,
        comparable_value: Math.round(comparableValue(row, repsPerRound) * 100) / 100,
        level: row.calculated_level,
        measured_at: row.measured_at,
        display: formatScore(row.score_type, row.score_value, row.extra_reps),
      }))
    if (points.length === 0) continue

    let deltaPct: number | null = null
    let trend: BenchmarkProgress['trend'] = 'stable'

    if (points.length >= 2) {
      const first = points[0].comparable_value
      const last = points[points.length - 1].comparable_value
      if (first > 0) {
        const raw = lowerIsBetter ? ((first - last) / first) * 100 : ((last - first) / first) * 100
        deltaPct = Math.round(raw * 10) / 10
        if (deltaPct > TREND_THRESHOLD_PCT) trend = 'improving'
        else if (deltaPct < -TREND_THRESHOLD_PCT) trend = 'declining'
      }
    }

    progressions.push({
      workout_id: workoutId,
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
