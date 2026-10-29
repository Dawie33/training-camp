/**
 * Tours (« laps ») d'une activité importée depuis un fichier FIT : une fraction et sa récupération sont deux tours
 * quand l'athlète appuie sur « tour » ou programme la séance sur sa montre.
 * Fonctions pures (sans Nest ni Knex) : testables directement, voir fit-laps.spec.ts.
 */

export interface FitLap {
  /** Numéro du tour dans l'activité, à partir de 1 */
  index: number
  duration_seconds: number | null
  distance_meters: number | null
  /** Seulement pour la course */
  avg_pace_min_km: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  /** Type donné par la montre : active, rest, warmup, cooldown, recovery, interval… (null si absent) */
  intensity: string | null
}

/** Borne la taille enregistrée dans `results.coros` (une séance de fractions en compte rarement plus de 40) */
export const MAX_LAPS = 100

/** Allure en min/km, ou null si la distance est trop faible pour avoir un sens. */
export function toPaceMinKm(duration_seconds: number | null, distance_meters: number | null): number | null {
  if (!duration_seconds || !distance_meters || distance_meters < 10) return null
  return Math.round((duration_seconds / 60 / (distance_meters / 1000)) * 100) / 100
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

/**
 * Tours d'une activité, tels que les renvoie fit-file-parser (secondes, mètres).
 * Un seul tour, c'est une activité que la montre n'a pas découpée : il répète les totaux, on ne le garde pas.
 */
export function extractLaps(laps: readonly object[] | undefined, isRun: boolean): FitLap[] {
  if (!laps || laps.length < 2) return []

  return laps.slice(0, MAX_LAPS).map((parsedLap, i) => {
    // Les champs d'un tour ne sont pas typés par fit-file-parser : chacun est vérifié avant usage
    const lap = parsedLap as Record<string, unknown>
    // Le temps chronométré exclut les pauses de la montre, contrairement au temps écoulé
    const duration = readNumber(lap.total_timer_time) ?? readNumber(lap.total_elapsed_time)
    const distance = readNumber(lap.total_distance)
    return {
      index: i + 1,
      duration_seconds: duration,
      distance_meters: distance,
      avg_pace_min_km: isRun ? toPaceMinKm(duration, distance) : null,
      avg_heart_rate: readNumber(lap.avg_heart_rate),
      max_heart_rate: readNumber(lap.max_heart_rate),
      intensity: typeof lap.intensity === 'string' ? lap.intensity : null,
    }
  })
}
