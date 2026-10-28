import { LoadSource, MovementExposure, MovementExposureResult } from '../types/analytics.types'
import { resolveMovementKey } from './lift-aliases'

export interface LoggedExercise {
  name: string
  /** Type de la section où l'exercice a été fait (`strength`, `metcon`…). */
  section_type?: string
  /** Séance d'origine : un mouvement présent dans plusieurs sections d'une séance compte une fois. */
  session_index: number
  load_kg?: number
  reps_completed?: number
  scaled: boolean
}

/** Part de scaling à partir de laquelle un mouvement est signalé comme point faible probable. */
const MOST_SCALED_THRESHOLD_PCT = 50

/** Expositions minimales avant de tirer une conclusion sur un mouvement. */
const MIN_EXPOSURES_FOR_VERDICT = 3

/** Sections de conditionnement : la charge y est celle du WOD, pas une charge de travail en force. */
const METCON_SECTIONS = new Set(['metcon', 'amrap', 'emom', 'for_time', 'circuit', 'intervals', 'tabata', 'finisher'])

/**
 * Exposition, charge et taux de scaling par mouvement sur la période.
 *
 * Le point faible d'un athlète se lit dans deux chiffres : ce qu'il scale le plus souvent,
 * et ce qu'il voit le moins. Un mouvement non exposé ne progresse pas.
 *
 * Une exposition = une séance où le mouvement apparaît, quel que soit le nombre de sections.
 * Les charges de force et de metcon ne se mélangent jamais : la moyenne de 70 kg en force et
 * 42,5 kg en metcon ne correspond à aucun travail réel. La force prime quand elle existe ;
 * les sections d'échauffement, d'accessoires ou de skill ne comptent pas dans les charges.
 *
 * @param exercises Résultats d'exercices agrégés sur la période, une entrée par exercice et par section
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
    /** Séances où le mouvement apparaît, et s'il y a été scalé dans au moins une section. */
    sessions: Map<number, boolean>
    totalReps: number
    strengthLoads: number[]
    metconLoads: number[]
  }

  const byMovement = new Map<string, Accumulator>()

  for (const exercise of exercises) {
    const name = exercise.name.trim()
    if (!name) continue
    const key = resolveMovementKey(name)
    const acc: Accumulator = byMovement.get(key) ?? {
      name,
      sessions: new Map(),
      totalReps: 0,
      strengthLoads: [],
      metconLoads: [],
    }

    acc.sessions.set(exercise.session_index, (acc.sessions.get(exercise.session_index) ?? false) || exercise.scaled)
    acc.totalReps += exercise.reps_completed ?? 0
    if (typeof exercise.load_kg === 'number' && exercise.load_kg > 0) {
      if (exercise.section_type === 'strength') {
        acc.strengthLoads.push(exercise.load_kg)
      } else if (exercise.section_type && METCON_SECTIONS.has(exercise.section_type)) {
        acc.metconLoads.push(exercise.load_kg)
      }
    }
    byMovement.set(key, acc)
  }

  const movements: MovementExposure[] = [...byMovement.entries()].map(([key, acc]) => {
    const loadSource: LoadSource | null =
      acc.strengthLoads.length > 0 ? 'strength' : acc.metconLoads.length > 0 ? 'metcon' : null
    const loads = loadSource === 'strength' ? acc.strengthLoads : acc.metconLoads
    const avgLoad =
      loads.length > 0 ? Math.round((loads.reduce((sum, load) => sum + load, 0) / loads.length) * 10) / 10 : null
    const maxLoad = loads.length > 0 ? Math.max(...loads) : null

    const oneRepMax = oneRepMaxes[key]
    const pctOf1rm = avgLoad !== null && oneRepMax > 0 ? Math.round((avgLoad / oneRepMax) * 100) : null

    const exposures = acc.sessions.size
    const scaledCount = [...acc.sessions.values()].filter(Boolean).length

    return {
      name: acc.name,
      exposures,
      total_reps: acc.totalReps,
      scaled_count: scaledCount,
      scaled_pct: Math.round((scaledCount / exposures) * 100),
      avg_load_kg: avgLoad,
      max_load_kg: maxLoad,
      pct_of_1rm: pctOf1rm,
      load_source: loadSource,
    }
  })

  movements.sort((a, b) => b.exposures - a.exposures || a.name.localeCompare(b.name))

  const mostScaled = movements
    .filter(m => m.exposures >= MIN_EXPOSURES_FOR_VERDICT && m.scaled_pct >= MOST_SCALED_THRESHOLD_PCT)
    .map(m => m.name)

  return { available: true, movements, most_scaled: mostScaled }
}
