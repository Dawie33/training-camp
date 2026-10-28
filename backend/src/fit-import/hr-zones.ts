/**
 * Calcul des zones de fréquence cardiaque d'une séance importée depuis un fichier FIT.
 * Fonctions pures (sans Nest ni Knex) : testables directement, voir hr-zones.spec.ts.
 */

export interface HrZoneData {
  zone: number
  label: string
  seconds: number
  high_bpm: number
}

/**
 * D'où vient la FC max qui sert de référence aux zones, du plus fiable au moins fiable :
 * - `profile` : FC max renseignée dans le profil de l'athlète
 * - `age` : estimation 220 − âge (date de naissance du profil)
 * - `session` : FC la plus haute atteinte pendant les séances importées. Dernier recours : une séance facile
 *   ne va jamais près de la vraie FC max, donc les zones y sont surestimées.
 */
export type HrMaxSource = 'profile' | 'age' | 'session'

export interface HrMaxReference {
  bpm: number
  source: HrMaxSource
}

/** Un point de fréquence cardiaque d'un enregistrement FIT (`record`). */
export interface HrSample {
  timestampMs: number | null
  heartRate: number
}

export const ZONE_LABELS = ['Recovery', 'Easy', 'Aerobic', 'Threshold', 'VO2 Max']
/** Borne haute de chaque zone, en fraction de la FC max (zone 5 : jusqu'à la FC max). */
export const ZONE_THRESHOLDS = [0.6, 0.7, 0.8, 0.9, 1.0]

/**
 * Au-delà de cet écart entre deux enregistrements, on considère que la montre était en pause
 * (ou a perdu le capteur) : on ne compte que ce plafond, pas tout le trou.
 * L'enregistrement « intelligent » des montres espace les points de quelques secondes, rarement plus de 30.
 */
export const MAX_SAMPLE_GAP_SECONDS = 30

/** FC max plausibles pour un adulte : en dehors, la valeur du profil est considérée comme une erreur de saisie. */
const MIN_PLAUSIBLE_MAX_HR = 100
const MAX_PLAUSIBLE_MAX_HR = 230
const MIN_AGE = 10
const MAX_AGE = 100

function isPlausibleMaxHr(bpm: number | null | undefined): bpm is number {
  return typeof bpm === 'number' && Number.isFinite(bpm) && bpm >= MIN_PLAUSIBLE_MAX_HR && bpm <= MAX_PLAUSIBLE_MAX_HR
}

/** Âge en années révolues à la date `now`, ou null si la date de naissance est absente ou invalide. */
export function ageFromDateOfBirth(dateOfBirth: Date | string | null | undefined, now: Date): number | null {
  if (!dateOfBirth) return null
  const birth = new Date(dateOfBirth)
  if (Number.isNaN(birth.getTime())) return null

  let age = now.getFullYear() - birth.getFullYear()
  const birthdayNotYetReached =
    now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  if (birthdayNotYetReached) age--

  return age >= MIN_AGE && age <= MAX_AGE ? age : null
}

/**
 * Choisit la FC max de référence : profil, sinon 220 − âge, sinon le max observé pendant la séance.
 * Renvoie null si aucune des trois n'est disponible (pas de zones calculables).
 */
export function resolveMaxHr(params: {
  profileMaxHr?: number | null
  dateOfBirth?: Date | string | null
  sessionMaxHr?: number | null
  now?: Date
}): HrMaxReference | null {
  if (isPlausibleMaxHr(params.profileMaxHr)) {
    return { bpm: Math.round(params.profileMaxHr), source: 'profile' }
  }

  const age = ageFromDateOfBirth(params.dateOfBirth, params.now ?? new Date())
  if (age !== null) {
    return { bpm: 220 - age, source: 'age' }
  }

  if (params.sessionMaxHr && params.sessionMaxHr > 0) {
    return { bpm: Math.round(params.sessionMaxHr), source: 'session' }
  }

  return null
}

/** Index (0 à 4) de la zone d'une fréquence cardiaque. Au-dessus de la FC max : zone 5. */
export function zoneIndexFor(heartRate: number, maxHr: number): number {
  const pct = heartRate / maxHr
  const index = ZONE_THRESHOLDS.findIndex(threshold => pct < threshold)
  return index === -1 ? ZONE_THRESHOLDS.length - 1 : index
}

function buildZones(secondsPerZone: number[], maxHr: number): HrZoneData[] {
  return ZONE_LABELS.map((label, i) => ({
    zone: i + 1,
    label,
    seconds: Math.round(secondsPerZone[i] ?? 0),
    high_bpm: Math.round(maxHr * ZONE_THRESHOLDS[i]),
  }))
}

/**
 * Temps passé dans chaque zone à partir des enregistrements de la séance.
 *
 * Chaque point compte pour la durée qui le sépare du point suivant (et non pour 1 s) : avec l'enregistrement
 * « intelligent », un point peut valoir 1 s comme 8 s. L'écart est plafonné à MAX_SAMPLE_GAP_SECONDS (pauses).
 * Le dernier point, sans suivant, compte pour 1 s, comme un point sans horodatage.
 */
export function computeHrZonesFromSamples(samples: HrSample[], maxHr: number): HrZoneData[] {
  const secondsPerZone = [0, 0, 0, 0, 0]
  const sorted = samples.filter(s => s.heartRate > 0).sort((a, b) => (a.timestampMs ?? 0) - (b.timestampMs ?? 0))

  sorted.forEach((sample, i) => {
    const next = sorted[i + 1]
    let seconds = 1
    if (next && sample.timestampMs !== null && next.timestampMs !== null) {
      seconds = Math.min(Math.max((next.timestampMs - sample.timestampMs) / 1000, 0), MAX_SAMPLE_GAP_SECONDS)
    }
    secondsPerZone[zoneIndexFor(sample.heartRate, maxHr)] += seconds
  })

  return buildZones(secondsPerZone, maxHr)
}

/**
 * Ramène le `time_in_hr_zone` de la montre à nos 5 zones, quand le fichier n'a pas d'enregistrements cardio.
 *
 * Les montres découpent avec leurs propres bornes (réglées sur la montre) et renvoient souvent plus de 5 valeurs :
 * la première correspond au temps sous la zone 1. Dans ce cas, on garde les 5 dernières comme zones 1 à 5 et
 * on ajoute les premières à la zone 1 (Recovery couvre tout ce qui est sous 60 %). Les `high_bpm` affichés sont
 * ceux de notre FC max de référence, pas les bornes de la montre.
 */
export function zonesFromDeviceTimeInZone(timeInZone: number[], maxHr: number): HrZoneData[] {
  const values = timeInZone.map(v => (Number.isFinite(v) && v > 0 ? v : 0))
  const extra = Math.max(values.length - ZONE_LABELS.length, 0)
  const secondsPerZone = values.slice(extra)
  secondsPerZone[0] = (secondsPerZone[0] ?? 0) + values.slice(0, extra).reduce((s, v) => s + v, 0)
  return buildZones(secondsPerZone, maxHr)
}

/** Additionne les zones de plusieurs activités (même FC max de référence) en ne gardant que les zones occupées. */
export function mergeHrZones(zonesList: (HrZoneData[] | null)[]): HrZoneData[] | null {
  const valid = zonesList.filter((z): z is HrZoneData[] => z != null && z.length > 0)
  if (!valid.length) return null

  const merged: HrZoneData[] = valid[0].map(z => ({ ...z, seconds: 0 }))
  for (const zones of valid) {
    for (const zone of zones) {
      const target = merged.find(m => m.zone === zone.zone)
      if (target) target.seconds += zone.seconds
    }
  }

  const result = merged.filter(z => z.seconds > 0)
  return result.length ? result : null
}
