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

function mergeFitDataList(dataList: ParsedFitData[]): ParsedFitData {
  const valid = dataList.filter(d => d !== null)

  const totalDuration = valid.reduce((sum, d) => sum + (d.duration_seconds ?? 0), 0)

  // FC moyenne pondérée par durée
  let avg_heart_rate: number | null = null
  const hrEntries = valid.filter(d => d.avg_heart_rate != null && d.duration_seconds != null)
  if (hrEntries.length) {
    const weightedSum = hrEntries.reduce((sum, d) => sum + d.avg_heart_rate! * d.duration_seconds!, 0)
    const totalDur = hrEntries.reduce((sum, d) => sum + d.duration_seconds!, 0)
    avg_heart_rate = Math.round(weightedSum / totalDur)
  }

  // Zones HR — cumul des secondes par zone (index 0-4)
  let hr_zones: HrZoneData[] | null = null
  const zonesData = valid.filter(d => d.hr_zones?.length)
  if (zonesData.length) {
    const merged: HrZoneData[] = (zonesData[0].hr_zones ?? []).map(z => ({ ...z, seconds: 0 }))
    for (const d of zonesData) {
      for (const zone of d.hr_zones ?? []) {
        const target = merged.find(m => m.zone === zone.zone)
        if (target) target.seconds += zone.seconds
      }
    }
    hr_zones = merged.filter(z => z.seconds > 0)
    if (!hr_zones.length) hr_zones = null
  }

  return {
    duration_seconds: totalDuration || null,
    calories: valid.reduce((sum, d) => sum + (d.calories ?? 0), 0) || null,
    avg_heart_rate,
    max_heart_rate: Math.max(...valid.map(d => d.max_heart_rate ?? 0)) || null,
    min_heart_rate: Math.min(...valid.filter(d => d.min_heart_rate != null).map(d => d.min_heart_rate!)) || null,
    distance_meters: valid.reduce((sum, d) => sum + (d.distance_meters ?? 0), 0) || null,
    sport: null,
    avg_temperature:
      valid.filter(d => d.avg_temperature != null).length
        ? Math.round(valid.filter(d => d.avg_temperature != null).reduce((s, d) => s + d.avg_temperature!, 0) / valid.filter(d => d.avg_temperature != null).length)
        : null,
    avg_cadence: null,
    hr_zones,
  }
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

  async parseMultipleFitFiles(buffers: Buffer[]): Promise<ParsedFitData> {
    const results = await Promise.all(buffers.map(b => this.parseFitFile(b)))
    return mergeFitDataList(results)
  }
}
