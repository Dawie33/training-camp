import { TrainingVolumeResult, WeeklyVolumePoint } from '../types/analytics.types'

export interface DatedSession {
  started_at: string
}

const MS_PER_WEEK = 7 * 24 * 3600 * 1000

/**
 * Date du lundi de la semaine contenant `date`, au format YYYY-MM-DD.
 * Sert de clé de regroupement hebdomadaire pour tout le module analytics.
 */
export function weekStart(date: Date): string {
  const monday = new Date(date)
  const dayOfWeek = monday.getDay()
  monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const day = String(monday.getDate()).padStart(2, '0')
  return `${monday.getFullYear()}-${month}-${day}`
}

/**
 * Volume et régularité d'entraînement sur la période observée.
 *
 * La régularité compte les semaines où au moins une séance a eu lieu, rapportées au
 * nombre de semaines couvertes : c'est la constance qui construit la progression,
 * davantage qu'un pic de volume isolé.
 *
 * @param sessions Séances de la période, avec leur date de début
 * @returns Totaux, moyenne hebdomadaire, régularité et détail par semaine
 */
export function computeTrainingVolume(sessions: DatedSession[]): TrainingVolumeResult {
  if (sessions.length === 0) {
    return { total_sessions: 0, week_span: 0, avg_per_week: 0, consistency_pct: 0, weeks: [] }
  }

  const timestamps = sessions.map(s => new Date(s.started_at).getTime()).filter(Number.isFinite)
  if (timestamps.length === 0) {
    return { total_sessions: 0, week_span: 0, avg_per_week: 0, consistency_pct: 0, weeks: [] }
  }

  const first = Math.min(...timestamps)
  const last = Math.max(...timestamps)
  const weekSpan = Math.max(1, Math.ceil((last - first) / MS_PER_WEEK))

  const perWeek = new Map<string, number>()
  for (const timestamp of timestamps) {
    const key = weekStart(new Date(timestamp))
    perWeek.set(key, (perWeek.get(key) ?? 0) + 1)
  }

  const weeks: WeeklyVolumePoint[] = [...perWeek.entries()]
    .map(([week_start, session_count]) => ({ week_start, session_count }))
    .sort((a, b) => a.week_start.localeCompare(b.week_start))

  return {
    total_sessions: timestamps.length,
    week_span: weekSpan,
    avg_per_week: Math.round((timestamps.length / weekSpan) * 10) / 10,
    consistency_pct: Math.min(100, Math.round((weeks.length / weekSpan) * 100)),
    weeks,
  }
}
