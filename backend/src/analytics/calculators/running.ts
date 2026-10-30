import {
  HyroxSimulation,
  HyroxSimulationProgress,
  RunningResult,
  RunningZoneShare,
  RunSegmentAnalysis,
  RunType,
  RunTypeCounts,
} from '../types/analytics.types'

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
  /** Heure de départ (ISO), absente des imports antérieurs à son enregistrement. */
  start_time: string | null
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
        start_time: typeof activity.start_time === 'string' ? activity.start_time : null,
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

/** Tours qui signalent un fractionné quand la montre les a marqués. */
const INTERVAL_MARKERS = new Set(['rest', 'recovery', 'interval'])
/** Au-delà de cet écart d'allure entre tours, la sortie alterne effort et récupération : c'est un fractionné. */
const INTERVAL_SPREAD_PCT = 25
/** Distance d'un segment de course Hyrox (1 km), avec la marge d'imprécision du GPS. */
const HYROX_SEGMENT_MIN_METERS = 800
const HYROX_SEGMENT_MAX_METERS = 1200
/** Une demi-simulation compte 4 segments, une complète 8. */
const HYROX_MIN_SEGMENTS = 4

const runsOf = (session: RunningSessionInput) => session.activities.filter(activity => isRunSport(activity.sport))
const hasStations = (session: RunningSessionInput) => session.activities.some(activity => !isRunSport(activity.sport))

/**
 * Courses d'une séance dans l'ordre où elles ont été faites, et si cet ordre est sûr.
 * Il ne l'est que si chaque fichier porte son heure de départ : sinon, c'est l'ordre de sélection des fichiers.
 */
function orderedRuns(session: RunningSessionInput): { runs: FitActivityInput[]; ordered: boolean } {
  const runs = runsOf(session)
  const ordered = runs.every(run => run.start_time !== null)
  return {
    runs: ordered ? [...runs].sort((a, b) => (a.start_time as string).localeCompare(b.start_time as string)) : runs,
    ordered,
  }
}

/**
 * Une sortie est un fractionné si la montre a marqué des récupérations, ou si l'allure varie de plus de 25 %
 * d'un tour à l'autre (au moins 4 tours). Des tours automatiques de 1 km sur un footing varient de quelques %.
 * Une sortie importée sans tours ne peut pas être reconnue : elle compte comme continue.
 */
export function isIntervalRun(run: FitActivityInput): boolean {
  if (run.laps.some(lap => lap.intensity !== null && INTERVAL_MARKERS.has(lap.intensity))) return true

  // Allure brute, sans la plage de course : une récupération en marchant compte justement ici
  const paces = run.laps.flatMap(lap =>
    lap.duration_seconds && lap.distance_meters && lap.distance_meters >= 100
      ? [lap.duration_seconds / lap.distance_meters]
      : []
  )
  if (paces.length < 4) return false
  return ((Math.max(...paces) - Math.min(...paces)) / Math.min(...paces)) * 100 >= INTERVAL_SPREAD_PCT
}

/** Type d'une séance de course : à stations, fractionné ou continue. */
export function classifyRunSession(session: RunningSessionInput): RunType {
  const runs = runsOf(session)
  if (hasStations(session) && runs.length >= 2) return 'stations'
  return runs.some(isIntervalRun) ? 'intervals' : 'continuous'
}

/**
 * Segments d'une séance :
 * - plusieurs fichiers de course entre d'autres activités → format à stations (Hyrox) ;
 * - sinon, les tours d'effort d'un fichier de course découpé par la montre.
 * Il faut au moins 2 segments à stations, ou 3 tours, pour que l'écart veuille dire quelque chose.
 */
function analyseSegments(session: RunningSessionInput): RunSegmentAnalysis | null {
  const date = new Date(session.started_at).toISOString()

  if (classifyRunSession(session) === 'stations') {
    const { runs, ordered } = orderedRuns(session)
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
      drift_pct: ordered ? changePct(paces[0], paces[paces.length - 1]) : null,
    }
  }

  // Le fichier le plus découpé de la séance : c'est lui qui porte les fractions
  const lapPaces = runsOf(session)
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

/**
 * Une simulation Hyrox : au moins 4 segments de course d'environ 1 km, séparés par des stations, et aucune
 * autre course. Une échelle (1 km, 800 m, 600 m…) ou un fractionné avec rameur n'en est donc pas une.
 * Renvoie le nombre de segments (le format) et le détail des temps, ou null.
 */
export function readHyroxSimulation(
  session: RunningSessionInput
): { run_segments: number; simulation: HyroxSimulation } | null {
  if (classifyRunSession(session) !== 'stations') return null
  const { runs, ordered } = orderedRuns(session)
  if (runs.length < HYROX_MIN_SEGMENTS) return null

  const isKmSegment = (run: FitActivityInput) =>
    run.distance_meters !== null &&
    run.distance_meters >= HYROX_SEGMENT_MIN_METERS &&
    run.distance_meters <= HYROX_SEGMENT_MAX_METERS &&
    segmentPace(run.duration_seconds, run.distance_meters) !== null
  if (!runs.every(isKmSegment)) return null

  // Un fichier de station sans durée rendrait le temps total faux : la séance n'est pas comparable
  if (session.activities.some(activity => !activity.duration_seconds)) return null

  const total = session.activities.reduce((sum, activity) => sum + (activity.duration_seconds as number), 0)
  const run = runs.reduce((sum, activity) => sum + (activity.duration_seconds as number), 0)
  const paces = runs.map(activity => segmentPace(activity.duration_seconds, activity.distance_meters) as number)

  return {
    run_segments: runs.length,
    simulation: {
      session_date: new Date(session.started_at).toISOString(),
      total_seconds: Math.round(total),
      run_seconds: Math.round(run),
      station_seconds: Math.round(total - run),
      run_share_pct: Math.round((run / total) * 100),
      run_drift_pct: ordered ? changePct(paces[0], paces[paces.length - 1]) : null,
    },
  }
}

/** Regroupe les simulations par format et compare chacune à la précédente du même format. */
function computeHyroxSimulations(sessions: RunningSessionInput[], nowMs: number): HyroxSimulationProgress[] {
  const byFormat = new Map<number, HyroxSimulation[]>()
  for (const session of sessions) {
    if (new Date(session.started_at).getTime() > nowMs) continue
    const found = readHyroxSimulation(session)
    if (!found) continue
    const list = byFormat.get(found.run_segments) ?? []
    list.push(found.simulation)
    byFormat.set(found.run_segments, list)
  }

  return [...byFormat.entries()]
    .map(([segments, simulations]) => {
      const sorted = [...simulations].sort((a, b) => b.session_date.localeCompare(a.session_date))
      const [latest, previous = null] = sorted
      return {
        format: `${segments} × 1 km`,
        run_segments: segments,
        count: sorted.length,
        latest,
        previous,
        delta_pct: previous ? changePct(previous.total_seconds, latest.total_seconds) : null,
      }
    })
    .sort((a, b) => b.latest.session_date.localeCompare(a.latest.session_date))
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
 * Diagnostic de course à pied : volume, types de sortie, allure des sorties continues, zones cardiaques,
 * tenue d'allure entre segments et simulations Hyrox.
 *
 * @param sessions Toutes les séances terminées avec un import .fit (les simulations ne sont pas bornées à la période)
 * @param periodStart Début de la période du diagnostic, pour les totaux, les zones et les segments
 * @param now Date de référence des fenêtres de 28 jours
 */
export function computeRunning(sessions: RunningSessionInput[], periodStart: Date, now = new Date()): RunningResult {
  const nowMs = now.getTime()
  const recentStart = nowMs - WINDOW_DAYS * DAY_MS
  const previousStart = nowMs - 2 * WINDOW_DAYS * DAY_MS

  const runs: (RunRef & { type: RunType })[] = []
  const periodRunActivities: FitActivityInput[] = []
  const segments: RunSegmentAnalysis[] = []
  const runTypes: RunTypeCounts = { continuous: 0, intervals: 0, stations: 0 }

  for (const session of sessions) {
    const at = new Date(session.started_at).getTime()
    if (!Number.isFinite(at) || at > nowMs) continue

    const runActivities = runsOf(session)
    if (runActivities.length === 0) continue
    const type = classifyRunSession(session)

    let validRuns = 0
    for (const activity of runActivities) {
      // Une activité sans allure exploitable (GPS coupé, tapis non calibré) ne fausse ni le volume ni l'allure
      if (segmentPace(activity.duration_seconds, activity.distance_meters) === null) continue
      validRuns += 1
      runs.push({
        at,
        type,
        duration_seconds: activity.duration_seconds as number,
        distance_meters: activity.distance_meters as number,
      })
    }
    if (validRuns > 0 && at > recentStart) runTypes[type] += 1

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
  const continuous = (list: (RunRef & { type: RunType })[]) => list.filter(run => run.type === 'continuous')

  const recentPace = weightedPace(continuous(recent))
  const previousPace = weightedPace(continuous(previous))

  return {
    available: inPeriod.length > 0,
    total_runs: inPeriod.length,
    total_distance_km: km(inPeriod),
    last_28_days_km: km(recent),
    previous_28_days_km: km(previous),
    run_types: runTypes,
    recent_pace_min_km: recentPace,
    previous_pace_min_km: previousPace,
    pace_change_pct: recentPace !== null && previousPace !== null ? changePct(previousPace, recentPace) : null,
    zones: computeZones(periodRunActivities),
    segments: segments.sort((a, b) => b.session_date.localeCompare(a.session_date)).slice(0, MAX_SEGMENT_SESSIONS),
    hyrox_simulations: computeHyroxSimulations(sessions, nowMs),
  }
}
