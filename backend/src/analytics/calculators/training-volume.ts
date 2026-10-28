import { TrainingVolumeResult, WeeklyVolumePoint } from '../types/analytics.types'

export interface DatedSession {
  started_at: string
}

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
 * Lundis de toutes les semaines de `from` à `to` inclus, au format de `weekStart`.
 * Sert à faire apparaître les semaines sans séance : un trou dans l'entraînement doit se voir.
 */
export function enumerateWeeks(from: Date, to: Date): string[] {
  const last = weekStart(to)
  const weeks: string[] = []
  // Minuit local, comme `weekStart`, pour ne pas glisser d'un jour selon le fuseau
  const cursor = new Date(`${weekStart(from)}T00:00:00`)
  while (weekStart(cursor) <= last) {
    weeks.push(weekStart(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}

const EMPTY_VOLUME: TrainingVolumeResult = {
  total_sessions: 0,
  week_span: 0,
  avg_per_week: 0,
  consistency_pct: 0,
  weeks: [],
}

/**
 * Volume et régularité d'entraînement sur la période observée.
 *
 * La régularité compte les semaines où au moins une séance a eu lieu, rapportées à toutes
 * les semaines de la fenêtre, de `windowStart` à la semaine en cours : c'est la constance
 * qui construit la progression, et un arrêt de deux mois doit faire baisser le chiffre.
 * La semaine en cours n'entre au dénominateur que si elle porte déjà une séance — un lundi
 * matin, l'athlète n'a encore rien manqué.
 *
 * @param sessions Séances de la période, avec leur date de début
 * @param windowStart Début de la fenêtre : début de la période, ou première séance enregistrée si elle est plus récente
 * @param now Date de référence (injectée pour rester testable)
 * @returns Totaux, moyenne hebdomadaire, régularité et détail par semaine, semaines vides comprises
 */
export function computeTrainingVolume(
  sessions: DatedSession[],
  windowStart: Date,
  now: Date = new Date()
): TrainingVolumeResult {
  const timestamps = sessions.map(s => new Date(s.started_at).getTime()).filter(Number.isFinite)
  if (timestamps.length === 0) return EMPTY_VOLUME

  const perWeek = new Map<string, number>()
  for (const timestamp of timestamps) {
    const key = weekStart(new Date(timestamp))
    perWeek.set(key, (perWeek.get(key) ?? 0) + 1)
  }

  // Une séance antérieure à la fenêtre l'élargit plutôt que d'être ignorée
  const from = new Date(Math.min(windowStart.getTime(), ...timestamps))
  const weekKeys = enumerateWeeks(from, now)
  if (!perWeek.has(weekStart(now))) weekKeys.pop()
  if (weekKeys.length === 0) return EMPTY_VOLUME

  const weeks: WeeklyVolumePoint[] = weekKeys.map(week_start => ({
    week_start,
    session_count: perWeek.get(week_start) ?? 0,
  }))
  const activeWeeks = weeks.filter(week => week.session_count > 0).length

  return {
    total_sessions: timestamps.length,
    week_span: weekKeys.length,
    avg_per_week: Math.round((timestamps.length / weekKeys.length) * 10) / 10,
    consistency_pct: Math.round((activeWeeks / weekKeys.length) * 100),
    weeks,
  }
}
