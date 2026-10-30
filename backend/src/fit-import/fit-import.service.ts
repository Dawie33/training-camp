import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import FitParser from 'fit-file-parser'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { assertValidFitHeader } from './fit-header'
import { extractLaps, FitLap, toPaceMinKm } from './fit-laps'
import {
  computeHrZonesFromSamples,
  HrMaxReference,
  HrSample,
  HrZoneData,
  mergeHrZones,
  resolveMaxHr,
  zonesFromDeviceTimeInZone,
} from './hr-zones'

export type { FitLap } from './fit-laps'
export type { HrMaxReference, HrMaxSource, HrZoneData } from './hr-zones'

type ParsedFit = Awaited<ReturnType<FitParser['parseAsync']>>
type ParsedSession = NonNullable<ParsedFit['sessions']>[number]

// Données extraites d'un fichier FIT (une activité), avant enrichissement dans FitActivity
export interface ParsedFitData {
  /** Heure de départ de l'activité (ISO), null si le fichier ne la donne pas */
  start_time: string | null
  duration_seconds: number | null
  calories: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  min_heart_rate: number | null
  distance_meters: number | null
  sport: string | null
  avg_temperature: number | null
  avg_cadence: number | null
  avg_power: number | null
  max_power: number | null
  /** Points de FC de la séance, gardés pour calculer les zones une fois la FC max de référence connue */
  hr_samples: HrSample[]
  /** Temps par zone calculé par la montre (avec ses propres bornes), utilisé si le fichier n'a pas de points de FC */
  device_time_in_hr_zone: number[] | null
  /** Tours enregistrés par la montre (fractions et récupérations), vide si l'activité n'est pas découpée */
  laps: FitLap[]
}

// Format enrichi par activité pour /parse-multiple
export interface FitActivity {
  /** Heure de départ (ISO) : donne l'ordre réel des activités d'une séance à stations */
  start_time: string | null
  sport: string | null
  duration_seconds: number | null
  calories: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  min_heart_rate: number | null
  distance_meters: number | null
  avg_temperature: number | null
  avg_cadence: number | null
  avg_power: number | null // uniquement pour le vélo
  max_power: number | null // uniquement pour le vélo
  avg_pace_min_km: number | null // uniquement pour le running
  hr_zones: HrZoneData[] | null
  laps: FitLap[]
}

export interface MultiActivityFitData {
  activities: FitActivity[]
  totals: {
    duration_seconds: number
    calories: number | null
    distance_meters: number | null
    avg_power: number | null
    hr_zones: HrZoneData[] | null
    /** FC max qui a servi au calcul des zones et son origine (profil, 220 − âge ou max de la séance) */
    hr_max_reference: HrMaxReference | null
  }
}

const isRunSport = (sport: string | null) => !!sport?.toLowerCase().includes('run')

/** Heure de départ au format ISO, ou null si la montre ne l'a pas écrite (ou valeur illisible). */
export function readStartTime(value: unknown): string | null {
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

/**
 * Remet les activités dans l'ordre où elles ont été faites, quel que soit l'ordre de sélection des fichiers :
 * c'est cet ordre qui permet de mesurer la dérive d'allure entre les segments d'une séance à stations.
 * Si une heure manque, l'ordre d'envoi est gardé tel quel plutôt que d'être deviné.
 */
export function sortByStartTime<T extends { start_time: string | null }>(activities: T[]): T[] {
  if (activities.some(activity => activity.start_time === null)) return activities
  return [...activities].sort((a, b) => (a.start_time as string).localeCompare(b.start_time as string))
}

interface UserHrProfile {
  max_heart_rate: number | null
  dateOfBirth: Date | string | null
}

/**
 * Points de FC de la séance. On prend ceux rangés dans les tours de la session (`session.laps[].records`),
 * sinon la liste à plat (`fitData.records`) pour un fichier sans tours.
 */
function extractHrSamples(fitData: ParsedFit, session: ParsedSession): HrSample[] {
  const lapRecords = session.laps?.flatMap(lap => lap.records ?? []) ?? []
  const records = lapRecords.length ? lapRecords : (fitData.records ?? [])

  return records
    .filter(r => typeof r.heart_rate === 'number' && r.heart_rate > 0)
    .map(r => {
      const time = r.timestamp ? new Date(r.timestamp).getTime() : NaN
      return { timestampMs: Number.isNaN(time) ? null : time, heartRate: r.heart_rate as number }
    })
}

/** Zones d'une activité : d'après les points de FC si on en a, sinon d'après le découpage de la montre. */
function computeActivityZones(data: ParsedFitData, maxHr: HrMaxReference | null): HrZoneData[] | null {
  if (!maxHr) return null

  let zones: HrZoneData[] | null = null
  if (data.hr_samples.length) {
    zones = computeHrZonesFromSamples(data.hr_samples, maxHr.bpm)
  } else if (data.device_time_in_hr_zone?.length) {
    zones = zonesFromDeviceTimeInZone(data.device_time_in_hr_zone, maxHr.bpm)
  }

  return zones && zones.some(z => z.seconds > 0) ? zones : null
}

/** FC la plus haute atteinte sur l'ensemble des activités (résumé de session ou points de FC). */
function highestSessionHr(parsed: ParsedFitData[]): number {
  return parsed.reduce(
    (max, d) => d.hr_samples.reduce((m, s) => Math.max(m, s.heartRate), Math.max(max, d.max_heart_rate ?? 0)),
    0
  )
}

@Injectable()
export class FitImportService {
  private readonly logger = new Logger(FitImportService.name)

  constructor(@InjectModel() private readonly knex: Knex) {}

  async parseFitFile(buffer: Buffer): Promise<ParsedFitData> {
    // Avant la librairie : un en-tête incohérent la ferait boucler et bloquerait tout le serveur
    assertValidFitHeader(buffer)

    // `both` : les points restent rangés par tour ET disponibles à plat dans `records`.
    // En `cascade` seul, `fitData.records` n'est jamais rempli (les zones de secours n'étaient donc jamais calculées).
    const parser = new FitParser({ mode: 'both' })
    let fitData: ParsedFit
    try {
      // Les buffers de Multer reposent toujours sur un ArrayBuffer classique (jamais un SharedArrayBuffer),
      // ce que le type générique Buffer<ArrayBufferLike> ne permet pas à TypeScript de savoir
      fitData = await parser.parseAsync(buffer as Buffer<ArrayBuffer>)
    } catch (error) {
      // En-tête correct mais contenu corrompu : la librairie rejette avec un message brut (sinon 500)
      this.logger.warn(`Fichier FIT illisible : ${error instanceof Error ? error.message : String(error)}`)
      throw new BadRequestException('Fichier FIT invalide ou corrompu')
    }

    const session = fitData.activity?.sessions?.[0] ?? fitData.sessions?.[0]
    if (!session) {
      throw new BadRequestException('Aucune session trouvée dans le fichier FIT')
    }

    const timeInZone: unknown = session.time_in_hr_zone
    const sport: string | null = session.sport ?? null
    return {
      start_time: readStartTime(session.start_time),
      duration_seconds: session.total_elapsed_time ?? null,
      calories: session.total_calories ?? null,
      avg_heart_rate: session.avg_heart_rate ?? null,
      max_heart_rate: session.max_heart_rate ?? null,
      min_heart_rate: session.min_heart_rate ?? null,
      distance_meters: session.total_distance ?? null,
      sport,
      avg_temperature: session.avg_temperature ?? null,
      avg_cadence: session.avg_cadence ?? null,
      avg_power: session.avg_power ?? null,
      max_power: session.max_power ?? null,
      hr_samples: extractHrSamples(fitData, session),
      device_time_in_hr_zone: Array.isArray(timeInZone) && timeInZone.length ? (timeInZone as number[]) : null,
      laps: extractLaps(session.laps, isRunSport(sport)),
    }
  }

  async parseMultipleFitFiles(buffers: Buffer[], userId: string): Promise<MultiActivityFitData> {
    // L'un après l'autre plutôt qu'avec Promise.all : limite le pic de mémoire (offre gratuite Render)
    const parsed: ParsedFitData[] = []
    for (const buffer of buffers) {
      parsed.push(await this.parseFitFile(buffer))
    }

    // Une seule FC max de référence pour toutes les activités, sinon les zones cumulées n'auraient pas de sens
    const profile: UserHrProfile | undefined = await this.knex('users')
      .where({ id: userId })
      .first(['max_heart_rate', 'dateOfBirth'])
    const hrMaxReference = resolveMaxHr({
      profileMaxHr: profile?.max_heart_rate,
      dateOfBirth: profile?.dateOfBirth,
      sessionMaxHr: highestSessionHr(parsed),
    })

    const activities: FitActivity[] = sortByStartTime(parsed).map(d => ({
      start_time: d.start_time,
      sport: d.sport,
      duration_seconds: d.duration_seconds,
      calories: d.calories,
      avg_heart_rate: d.avg_heart_rate,
      max_heart_rate: d.max_heart_rate,
      min_heart_rate: d.min_heart_rate,
      distance_meters: d.distance_meters,
      avg_temperature: d.avg_temperature,
      avg_cadence: d.avg_cadence,
      avg_power: d.avg_power,
      max_power: d.max_power,
      avg_pace_min_km: isRunSport(d.sport) ? toPaceMinKm(d.duration_seconds, d.distance_meters) : null,
      hr_zones: computeActivityZones(d, hrMaxReference),
      laps: d.laps,
    }))

    const totalDuration = activities.reduce((s, a) => s + (a.duration_seconds ?? 0), 0)
    const totalCalories = activities.reduce((s, a) => s + (a.calories ?? 0), 0)
    const totalDistance = activities.reduce((s, a) => s + (a.distance_meters ?? 0), 0)
    const powerWeightedSum = activities.reduce(
      (s, a) => s + (a.avg_power && a.duration_seconds ? a.avg_power * a.duration_seconds : 0),
      0
    )
    const powerWeightedDuration = activities.reduce(
      (s, a) => s + (a.avg_power && a.duration_seconds ? a.duration_seconds : 0),
      0
    )
    const hrZones = mergeHrZones(activities.map(a => a.hr_zones))

    return {
      activities,
      totals: {
        duration_seconds: totalDuration,
        calories: totalCalories || null,
        distance_meters: totalDistance || null,
        avg_power: powerWeightedDuration > 0 ? Math.round(powerWeightedSum / powerWeightedDuration) : null,
        hr_zones: hrZones,
        hr_max_reference: hrZones ? hrMaxReference : null,
      },
    }
  }
}
