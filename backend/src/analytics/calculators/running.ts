import { RunningResult, RunningZoneShare, RunSegmentAnalysis } from '../types/analytics.types'

/**
 * Course à pied, lue dans les fichiers .fit importés au log de séance (`results.coros.activities`).
 * Fonctions pures (sans Nest ni Knex) : testables directement, voir running.spec.ts.
 *
 * Seules les séances importées avec un .fit portent une distance et une allure : une course
 * saisie à la main n'a pas de distance enregistrée, elle n'entre donc pas dans ce calcul.
 */

export interface RunLap {
  duration_seconds: number | null
  distance_meters: number | null
  intensity: string | null
}

export interface RunZone {
  zone: number
  label: string
  seconds: number
}

/** Activité d'un fichier .fit, telle qu'enregistrée dans `results.coros.activities`. */
export interface FitActivityInput {
  sport: string | null
  duration_seconds: number | null
  distance_meters: number | null
  hr_zones: RunZone[] | null
  laps: RunLap[]
}

export interface RunningSessionInput {
  started_at: string
  /** Toutes les activités de la séance, course ou non : les autres signalent un format à stations. */
  activities: FitActivityInput[]
}

const DAY_MS = 24 * 3600 * 1000
const WINDOW_DAYS = 28
/** Sous 200 m, l'allure d'un fichier ou d'un tour dépend surtout de l'imprécision du GPS. */
const MIN_SEGMENT_METERS = 200
/** Hors de cette plage (min/km), l'allure est une erreur de mesure ou de la marche, pas de la course. */
const MIN_PACE = 2.5
const MAX_PACE = 15
/** Tours qui ne sont pas de l'effort : on ne les compare pas aux fractions. */
const NON_EFFORT_LAPS = new Set(['warmup', 'cooldown', 'rest', 'recovery'])
const MAX_SEGMENT_SESSIONS = 5

/** Même règle que l'import .fit : `running`, `trail_running`, etc. */
export function isRunSport(sport: string | null): boolean {
  return !!sport?.toLowerCase().includes('run')
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

/**
 * Les zones ne valent que si la FC max de référence vient du profil ou de l'âge. Calculées sur la FC max
 * de la séance elle-même, une sortie facile passe en zone 5 : le diagnostic dirait « trop intense » à tort.
 * Un import sans référence enregistrée (antérieur à ce champ) est écarté pour la même raison.
 */
function hasReliableMaxHr(coros: Record<string, unknown>): boolean {
  const totals = coros.totals as Record<string, unknown> | undefined
  const reference = totals?.hr_max_reference as Record<string, unknown> | null | undefined
  return reference?.source === 'profile' || reference?.source === 'age'
}

/**
 * Relit les activités .fit d'une séance. Le champ `results` est un jsonb libre : chaque valeur
 * est vérifiée, et une activité illisible est ignorée plutôt que de faire échouer le diagnostic.
 */
export function readFitActivities(results: Record<string, unknown> | null): FitActivityInput[] {
  const coros = results?.coros
  if (typeof coros !== 'object' || coros === null) return []
  const raw = (coros as Record<string, unknown>).activities
  if (!Array.isArray(raw)) return []
  const zonesAreReliable = hasReliableMaxHr(coros as Record<string, unknown>)

  return raw.flatMap(item => {
    if (typeof item !== 'object' || item === null) return []
    const activity = item as Record<string, unknown>

    const zones =
      zonesAreReliable && Array.isArray(activity.hr_zones)
        ? activity.hr_zones.flatMap(zone => {
            const z = zone as Record<string, unknown>
            const index = readNumber(z?.zone)
            const seconds = readNumber(z?.seconds)
            return index !== null && seconds !== null
              ? [{ zone: index, label: typeof z.label === 'string' ? z.label : `Z${index}`, seconds }]
              : []
          })
        : null

    const laps = Array.isArray(activity.laps)
      ? activity.laps.flatMap(lap => {
          if (typeof lap !== 'object' || lap === null) return []
          const l = lap as Record<string, unknown>
          return [
            {
              duration_seconds: readNumber(l.duration_seconds),
              distance_meters: readNumber(l.distance_meters),
              intensity: typeof l.intensity === 'string' ? l.intensity : null,
            },
          ]
        })
      : []

    return [
      {
        sport: typeof activity.sport === 'string' ? activity.sport : null,
        duration_seconds: readNumber(activity.duration_seconds),
        distance_meters: readNumber(activity.distance_meters),
        hr_zones: zones && zones.length > 0 ? zones : null,
        laps,
      },
    ]
  })
}

/** Allure en min/km d'un segment, ou null s'il est trop court ou hors de la plage de course. */
export function segmentPace(durationSeconds: number | null, distanceMeters: number | null): number | null {
  if (!durationSeconds || !distanceMeters || distanceMeters < MIN_SEGMENT_METERS) return null
  const pace = durationSeconds / 60 / (distanceMeters / 1000)
  return pace >= MIN_PACE && pace <= MAX_PACE ? pace : null
}

const round = (value: number, decimals: number) => Math.round(value * 10 ** decimals) / 10 ** decimals

/** Écart en % de `to` par rapport à `from` (positif = `to` plus lent). */
const changePct = (from: number, to: number) => round(((to - from) / from) * 100, 1)

interface RunRef {
  at: number
  duration_seconds: number
  distance_meters: number
}

/** Allure moyenne pondérée par la distance : une sortie de 10 km pèse plus qu'un 1 km. */
function weightedPace(runs: RunRef[]): number | null {
  if (runs.length < 2) return null
  const seconds = runs.reduce((sum, run) => sum + run.duration_seconds, 0)
  const km = runs.reduce((sum, run) => sum + run.distance_meters, 0) / 1000
  return km > 0 ? round(seconds / 60 / km, 2) : null
}

/**
 * Segments d'une séance :
 * - plusieurs fichiers de course entre d'autres activités → format à stations (Hyrox) ;
 * - sinon, les tours d'effort d'un fichier de course découpé par la montre.
 * Il faut au moins 2 segments à stations, ou 3 tours, pour que l'écart veuille dire quelque chose.
 */
function analyseSegments(session: RunningSessionInput): RunSegmentAnalysis | null {
  const runs = session.activities.filter(activity => isRunSport(activity.sport))
  const hasStations = session.activities.some(activity => !isRunSport(activity.sport))
  const date = new Date(session.started_at).toISOString()

  if (hasStations && runs.length >= 2) {
    const paces = runs.flatMap(run => {
      const pace = segmentPace(run.duration_seconds, run.distance_meters)
      return pace === null ? [] : [pace]
    })
    if (paces.length < 2) return null
    return {
      session_date: date,
      kind: 'stations',
      paces_min_km: paces.map(pace => round(pace, 2)),
      spread_pct: changePct(Math.min(...paces), Math.max(...paces)),
      drift_pct: null,
    }
  }

  // Le fichier le plus découpé de la séance : c'est lui qui porte les fractions
  const lapPaces = runs
    .map(run =>
      run.laps.flatMap(lap => {
        if (lap.intensity && NON_EFFORT_LAPS.has(lap.intensity)) return []
        const pace = segmentPace(lap.duration_seconds, lap.distance_meters)
        return pace === null ? [] : [pace]
      })
    )
    .sort((a, b) => b.length - a.length)[0]

  if (!lapPaces || lapPaces.length < 3) return null
  return {
    session_date: date,
    kind: 'laps',
    paces_min_km: lapPaces.map(pace => round(pace, 2)),
    spread_pct: changePct(Math.min(...lapPaces), Math.max(...lapPaces)),
    drift_pct: changePct(lapPaces[0], lapPaces[lapPaces.length - 1]),
  }
}

/** Répartition du temps de course par zone cardiaque, sur toutes les activités qui en portent. */
function computeZones(activities: FitActivityInput[]): RunningZoneShare[] | null {
  const byZone = new Map<number, { label: string; seconds: number }>()
  for (const activity of activities) {
    for (const zone of activity.hr_zones ?? []) {
      const current = byZone.get(zone.zone) ?? { label: zone.label, seconds: 0 }
      current.seconds += zone.seconds
      byZone.set(zone.zone, current)
    }
  }

  const total = [...byZone.values()].reduce((sum, zone) => sum + zone.seconds, 0)
  if (total <= 0) return null

  return [...byZone.entries()]
    .sort(([a], [b]) => a - b)
    .map(([zone, { label, seconds }]) => ({ zone, label, share_pct: Math.round((seconds / total) * 100) }))
}

/**
 * Diagnostic de course à pied : volume, allure, zones cardiaques et tenue d'allure entre segments.
 *
 * @param sessions Séances terminées depuis au moins 56 jours, avec leurs activités .fit
 * @param periodStart Début de la période du diagnostic, pour les totaux
 * @param now Date de référence des fenêtres de 28 jours
 */
export function computeRunning(sessions: RunningSessionInput[], periodStart: Date, now = new Date()): RunningResult {
  const nowMs = now.getTime()
  const recentStart = nowMs - WINDOW_DAYS * DAY_MS
  const previousStart = nowMs - 2 * WINDOW_DAYS * DAY_MS

  const runs: RunRef[] = []
  const periodRunActivities: FitActivityInput[] = []
  const segments: RunSegmentAnalysis[] = []

  for (const session of sessions) {
    const at = new Date(session.started_at).getTime()
    if (!Number.isFinite(at) || at > nowMs) continue

    const runActivities = session.activities.filter(activity => isRunSport(activity.sport))
    if (runActivities.length === 0) continue

    for (const activity of runActivities) {
      // Une activité sans allure exploitable (GPS coupé, tapis non calibré) ne fausse ni le volume ni l'allure
      if (segmentPace(activity.duration_seconds, activity.distance_meters) === null) continue
      runs.push({
        at,
        duration_seconds: activity.duration_seconds as number,
        distance_meters: activity.distance_meters as number,
      })
    }

    if (at >= periodStart.getTime()) {
      periodRunActivities.push(...runActivities)
      const analysis = analyseSegments(session)
      if (analysis) segments.push(analysis)
    }
  }

  const inPeriod = runs.filter(run => run.at >= periodStart.getTime())
  const recent = runs.filter(run => run.at > recentStart)
  const previous = runs.filter(run => run.at > previousStart && run.at <= recentStart)
  const km = (list: RunRef[]) => round(list.reduce((sum, run) => sum + run.distance_meters, 0) / 1000, 1)

  const recentPace = weightedPace(recent)
  const previousPace = weightedPace(previous)

  return {
    available: inPeriod.length > 0,
    total_runs: inPeriod.length,
    total_distance_km: km(inPeriod),
    last_28_days_km: km(recent),
    previous_28_days_km: km(previous),
    recent_pace_min_km: recentPace,
    previous_pace_min_km: previousPace,
    pace_change_pct: recentPace !== null && previousPace !== null ? changePct(previousPace, recentPace) : null,
    zones: computeZones(periodRunActivities),
    segments: segments.sort((a, b) => b.session_date.localeCompare(a.session_date)).slice(0, MAX_SEGMENT_SESSIONS),
  }
}
