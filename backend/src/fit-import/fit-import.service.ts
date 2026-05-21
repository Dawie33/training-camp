import { BadRequestException, Injectable } from '@nestjs/common'
import FitParser from 'fit-file-parser'

export interface HrZoneData {
  zone: number
  label: string
  seconds: number
  high_bpm: number
}

export interface ParsedFitData {
  duration_seconds: number | null
  calories: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  min_heart_rate: number | null
  distance_meters: number | null
  sport: string | null
  avg_temperature: number | null
  avg_cadence: number | null
  hr_zones: HrZoneData[] | null
}

const ZONE_LABELS = ['Recovery', 'Easy', 'Aerobic', 'Threshold', 'VO2 Max']
const ZONE_THRESHOLDS = [0.6, 0.7, 0.8, 0.9, 1.0] // % de FCmax (borne haute de chaque zone)

function computeHrZones(records: { heart_rate?: number }[], maxHr: number): HrZoneData[] {
  const zoneCounts = [0, 0, 0, 0, 0]

  for (const r of records) {
    if (!r.heart_rate) continue
    const pct = r.heart_rate / maxHr
    if (pct < ZONE_THRESHOLDS[0]) zoneCounts[0]++
    else if (pct < ZONE_THRESHOLDS[1]) zoneCounts[1]++
    else if (pct < ZONE_THRESHOLDS[2]) zoneCounts[2]++
    else if (pct < ZONE_THRESHOLDS[3]) zoneCounts[3]++
    else zoneCounts[4]++
  }

  return zoneCounts.map((count, i) => ({
    zone: i + 1,
    label: ZONE_LABELS[i],
    seconds: count, // 1 record ≈ 1 seconde
    high_bpm: Math.round(maxHr * ZONE_THRESHOLDS[i]),
  }))
}

@Injectable()
export class FitImportService {
  async parseFitFile(buffer: Buffer): Promise<ParsedFitData> {
    const parser = new FitParser({ mode: 'cascade' })
    const fitData = await parser.parseAsync(buffer)

    const session = fitData.sessions?.[0] ?? fitData.activity?.sessions?.[0]
    if (!session) {
      throw new BadRequestException('Aucune session trouvée dans le fichier FIT')
    }

    // Zones FC — depuis le fichier si dispo, sinon calculées depuis les records
    let hr_zones: HrZoneData[] | null = null

    if (session.time_in_hr_zone?.length) {
      // Zones natives exportées par la montre
      hr_zones = session.time_in_hr_zone.map((seconds, i) => ({
        zone: i + 1,
        label: ZONE_LABELS[i] ?? `Zone ${i + 1}`,
        seconds,
        high_bpm: Math.round((session.max_heart_rate ?? 200) * ZONE_THRESHOLDS[i]),
      }))
    } else if (fitData.records?.length && session.max_heart_rate) {
      // Calcul depuis les records seconde par seconde
      hr_zones = computeHrZones(fitData.records, session.max_heart_rate)
    }

    // Filtrer les zones vides (aucun temps passé)
    if (hr_zones && hr_zones.every(z => z.seconds === 0)) {
      hr_zones = null
    }

    return {
      duration_seconds: session.total_elapsed_time ?? null,
      calories: session.total_calories ?? null,
      avg_heart_rate: session.avg_heart_rate ?? null,
      max_heart_rate: session.max_heart_rate ?? null,
      min_heart_rate: session.min_heart_rate ?? null,
      distance_meters: session.total_distance ?? null,
      sport: session.sport ?? null,
      avg_temperature: session.avg_temperature ?? null,
      avg_cadence: session.avg_cadence ?? null,
      hr_zones,
    }
  }
}
