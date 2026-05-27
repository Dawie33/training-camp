import { BadRequestException, Injectable } from '@nestjs/common'
import FitParser from 'fit-file-parser'

export interface HrZoneData {
  zone: number
  label: string
  seconds: number
  high_bpm: number
}

// Format renvoyé par l'endpoint /parse (fichier unique, rétrocompat)
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

// Format enrichi par activité pour /parse-multiple
export interface FitActivity {
  sport: string | null
  duration_seconds: number | null
  calories: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  min_heart_rate: number | null
  distance_meters: number | null
  avg_temperature: number | null
  avg_cadence: number | null
  avg_pace_min_km: number | null // uniquement pour le running
  hr_zones: HrZoneData[] | null
}

export interface MultiActivityFitData {
  activities: FitActivity[]
  totals: {
    duration_seconds: number
    calories: number | null
    distance_meters: number | null
    hr_zones: HrZoneData[] | null
  }
}

const ZONE_LABELS = ['Recovery', 'Easy', 'Aerobic', 'Threshold', 'VO2 Max']
const ZONE_THRESHOLDS = [0.6, 0.7, 0.8, 0.9, 1.0]

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
    seconds: count,
    high_bpm: Math.round(maxHr * ZONE_THRESHOLDS[i]),
  }))
}

function mergeHrZones(zonesList: (HrZoneData[] | null)[]): HrZoneData[] | null {
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

function toPaceMinKm(duration_seconds: number | null, distance_meters: number | null): number | null {
  if (!duration_seconds || !distance_meters || distance_meters < 10) return null
  return Math.round(((duration_seconds / 60) / (distance_meters / 1000)) * 100) / 100
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

    let hr_zones: HrZoneData[] | null = null

    if (session.time_in_hr_zone?.length) {
      hr_zones = session.time_in_hr_zone.map((seconds, i) => ({
        zone: i + 1,
        label: ZONE_LABELS[i] ?? `Zone ${i + 1}`,
        seconds,
        high_bpm: Math.round((session.max_heart_rate ?? 200) * ZONE_THRESHOLDS[i]),
      }))
    } else if (fitData.records?.length && session.max_heart_rate) {
      hr_zones = computeHrZones(fitData.records, session.max_heart_rate)
    }

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

  async parseMultipleFitFiles(buffers: Buffer[]): Promise<MultiActivityFitData> {
    const parsed = await Promise.all(buffers.map(b => this.parseFitFile(b)))

    const activities: FitActivity[] = parsed.map(d => ({
      sport: d.sport,
      duration_seconds: d.duration_seconds,
      calories: d.calories,
      avg_heart_rate: d.avg_heart_rate,
      max_heart_rate: d.max_heart_rate,
      min_heart_rate: d.min_heart_rate,
      distance_meters: d.distance_meters,
      avg_temperature: d.avg_temperature,
      avg_cadence: d.avg_cadence,
      avg_pace_min_km: d.sport?.toLowerCase().includes('run')
        ? toPaceMinKm(d.duration_seconds, d.distance_meters)
        : null,
      hr_zones: d.hr_zones,
    }))

    const totalDuration = activities.reduce((s, a) => s + (a.duration_seconds ?? 0), 0)
    const totalCalories = activities.reduce((s, a) => s + (a.calories ?? 0), 0)
    const totalDistance = activities.reduce((s, a) => s + (a.distance_meters ?? 0), 0)

    return {
      activities,
      totals: {
        duration_seconds: totalDuration,
        calories: totalCalories || null,
        distance_meters: totalDistance || null,
        hr_zones: mergeHrZones(activities.map(a => a.hr_zones)),
      },
    }
  }
}
