import { MovementExposure, MovementExposureResult } from '../types/analytics.types'

export interface LoggedExercise {
  name: string
  load_kg?: number
  reps_completed?: number
  scaled: boolean
}

/** Part de scaling à partir de laquelle un mouvement est signalé comme point faible probable. */
const MOST_SCALED_THRESHOLD_PCT = 50

/** Expositions minimales avant de tirer une conclusion sur un mouvement. */
const MIN_EXPOSURES_FOR_VERDICT = 3

/**
 * Rapproche un nom de mouvement de l'identifiant de lift correspondant, pour pouvoir
 * exprimer une charge en pourcentage du 1RM. Un mouvement sans 1RM connu reste analysé
 * sur ses expositions et son taux de scaling.
 */
function toLiftKey(movementName: string): string {
  return movementName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * Exposition, charge et taux de scaling par mouvement sur la période.
 *
 * Le point faible d'un athlète se lit dans deux chiffres : ce qu'il scale le plus souvent,
 * et ce qu'il voit le moins. Un mouvement non exposé ne progresse pas.
 *
 * @param exercises Résultats d'exercices agrégés sur la période
 * @param oneRepMaxes 1RM par lift, en kg, pour exprimer les charges en % du max
 * @returns Le détail par mouvement, du plus exposé au moins exposé
 */
export function computeMovementExposure(
  exercises: LoggedExercise[],
  oneRepMaxes: Record<string, number> = {}
): MovementExposureResult {
  if (exercises.length === 0) {
    return { available: false, movements: [], most_scaled: [] }
  }

  interface Accumulator {
    name: string
    exposures: number
    totalReps: number
    scaledCount: number
    loads: number[]
  }

  const byMovement = new Map<string, Accumulator>()

  for (const exercise of exercises) {
    const name = exercise.name.trim()
    if (!name) continue
    const key = toLiftKey(name)
    const acc = byMovement.get(key) ?? { name, exposures: 0, totalReps: 0, scaledCount: 0, loads: [] }
    acc.exposures += 1
    acc.totalReps += exercise.reps_completed ?? 0
    if (exercise.scaled) acc.scaledCount += 1
    if (typeof exercise.load_kg === 'number' && exercise.load_kg > 0) acc.loads.push(exercise.load_kg)
    byMovement.set(key, acc)
  }

  const movements: MovementExposure[] = [...byMovement.entries()].map(([key, acc]) => {
    const avgLoad = acc.loads.length > 0
      ? Math.round((acc.loads.reduce((sum, load) => sum + load, 0) / acc.loads.length) * 10) / 10
      : null
    const maxLoad = acc.loads.length > 0 ? Math.max(...acc.loads) : null

    const oneRepMax = oneRepMaxes[key]
    const pctOf1rm = avgLoad !== null && oneRepMax > 0
      ? Math.round((avgLoad / oneRepMax) * 100)
      : null

    return {
      name: acc.name,
      exposures: acc.exposures,
      total_reps: acc.totalReps,
      scaled_count: acc.scaledCount,
      scaled_pct: Math.round((acc.scaledCount / acc.exposures) * 100),
      avg_load_kg: avgLoad,
      max_load_kg: maxLoad,
      pct_of_1rm: pctOf1rm,
    }
  })

  movements.sort((a, b) => b.exposures - a.exposures || a.name.localeCompare(b.name))

  const mostScaled = movements
    .filter(m => m.exposures >= MIN_EXPOSURES_FOR_VERDICT && m.scaled_pct >= MOST_SCALED_THRESHOLD_PCT)
    .map(m => m.name)

  return { available: true, movements, most_scaled: mostScaled }
}
