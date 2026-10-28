import { AcwrZone, TrainingLoadResult, WeeklyLoadPoint } from '../types/analytics.types'
import { enumerateWeeks, weekStart } from './training-volume'

export interface RpeSession {
  started_at: string
  /** Effort perçu sur l'échelle CR-10. Les séances sans RPE sont écartées du calcul. */
  rpe?: number | null
  /** Durée de la séance entière, en minutes (voir `resolveSessionMinutes`). */
  session_minutes?: number | null
}

const MS_PER_DAY = 24 * 3600 * 1000
const ACUTE_WINDOW_DAYS = 7
const CHRONIC_WINDOW_DAYS = 28

/**
 * Durée retenue quand une séance porte un RPE sans durée exploitable.
 * Évite de perdre l'information d'effort ; valeur conservatrice d'une séance type.
 */
const DEFAULT_SESSION_MINUTES = 60

/** Lundi de la semaine qui précède `week` (clé produite par `weekStart`). */
function previousWeek(week: string): string {
  const monday = new Date(`${week}T00:00:00`)
  monday.setDate(monday.getDate() - 7)
  return weekStart(monday)
}

/**
 * Durée de la séance entière à croiser avec le RPE, en minutes.
 *
 * Jamais le chrono du metcon (`elapsed_time_seconds`) : un metcon de 12 min dans une séance
 * de 70 min diviserait la charge par six, alors que le RPE note toute la séance.
 * Ordre de préférence : durée saisie, puis durée de l'activité .fit, qui couvre tout
 * l'enregistrement de la montre. Null quand aucune n'est exploitable.
 *
 * @param results Champ `results` de la séance
 */
export function resolveSessionMinutes(results: Record<string, unknown> | null): number | null {
  const declared = results?.session_duration_minutes
  if (typeof declared === 'number' && Number.isFinite(declared) && declared > 0) return declared

  const coros = results?.coros as { totals?: { duration_seconds?: unknown } } | undefined
  const fitSeconds = coros?.totals?.duration_seconds
  if (typeof fitSeconds === 'number' && Number.isFinite(fitSeconds) && fitSeconds > 0) {
    return Math.round(fitSeconds / 60)
  }

  return null
}

/** Zone de risque associée au ratio charge aiguë / charge chronique. */
export function classifyAcwr(acwr: number): AcwrZone {
  if (acwr < 0.8) return 'undertrained'
  if (acwr <= 1.3) return 'optimal'
  if (acwr <= 1.5) return 'caution'
  return 'high_risk'
}

/**
 * Charge d'entraînement à partir du RPE de séance (méthode sRPE de Foster).
 *
 * sRPE = RPE × durée en minutes. Le ratio charge aiguë (7 jours) sur charge chronique
 * (28 jours) situe le risque : une montée brutale de charge est le premier facteur de
 * blessure évitable, devant le volume absolu.
 *
 * @param sessions Séances de la période
 * @param now Date de référence des fenêtres glissantes (injectée pour rester testable)
 * @returns Charges hebdomadaires, ACWR et sa zone, ou un résultat non disponible si aucun RPE
 */
export function computeTrainingLoad(sessions: RpeSession[], now: Date = new Date()): TrainingLoadResult {
  const scored = sessions
    .map(session => {
      const rpe = session.rpe
      if (typeof rpe !== 'number' || rpe <= 0) return null
      const timestamp = new Date(session.started_at).getTime()
      if (!Number.isFinite(timestamp)) return null

      const sessionMinutes = session.session_minutes
      const minutes =
        typeof sessionMinutes === 'number' && sessionMinutes > 0 ? sessionMinutes : DEFAULT_SESSION_MINUTES

      return { timestamp, srpe: Math.round(rpe * minutes) }
    })
    .filter((entry): entry is { timestamp: number; srpe: number } => entry !== null)

  if (scored.length === 0) {
    return {
      available: false,
      sessions_with_rpe: 0,
      weeks: [],
      acute: null,
      chronic: null,
      acwr: null,
      acwr_zone: null,
      last_week_change_pct: null,
    }
  }

  const perWeek = new Map<string, { srpe: number; session_count: number }>()
  for (const entry of scored) {
    const key = weekStart(new Date(entry.timestamp))
    const bucket = perWeek.get(key) ?? { srpe: 0, session_count: 0 }
    bucket.srpe += entry.srpe
    bucket.session_count += 1
    perWeek.set(key, bucket)
  }

  const reference = now.getTime()
  const sumSince = (days: number) =>
    scored
      .filter(entry => reference - entry.timestamp <= days * MS_PER_DAY && entry.timestamp <= reference)
      .reduce((total, entry) => total + entry.srpe, 0)

  const acute = sumSince(ACUTE_WINDOW_DAYS)
  // Charge chronique ramenée à une base hebdomadaire, pour être comparable à la charge aiguë.
  const chronic = Math.round((sumSince(CHRONIC_WINDOW_DAYS) / CHRONIC_WINDOW_DAYS) * ACUTE_WINDOW_DAYS)

  // La charge chronique se dilue sur 28 jours pleins. Tant que l'historique est plus court,
  // le dénominateur est artificiellement bas et le ratio alarmerait à tort un athlète
  // qui commence simplement à enregistrer ses séances.
  const oldest = Math.min(...scored.map(entry => entry.timestamp))
  const historyDays = (reference - oldest) / MS_PER_DAY
  const hasEnoughHistory = historyDays >= CHRONIC_WINDOW_DAYS

  const acwr = hasEnoughHistory && chronic > 0 ? Math.round((acute / chronic) * 100) / 100 : null

  // Semaines vides comprises : une coupure fait chuter la charge, le graphe doit le montrer.
  // La semaine en cours n'apparaît qu'une fois entamée.
  const currentWeek = weekStart(now)
  const weekKeys = enumerateWeeks(new Date(oldest), now)
  if (!perWeek.has(currentWeek)) weekKeys.pop()
  const weeks: WeeklyLoadPoint[] = weekKeys.map(week_start => ({
    week_start,
    ...(perWeek.get(week_start) ?? { srpe: 0, session_count: 0 }),
  }))

  // Dernière semaine complète contre celle d'avant : comparer la semaine en cours, inachevée,
  // afficherait une baisse à chaque début de semaine.
  const lastCompleteWeek = previousWeek(currentWeek)
  const previous = perWeek.get(previousWeek(lastCompleteWeek))?.srpe ?? 0
  const last = perWeek.get(lastCompleteWeek)?.srpe ?? 0
  const lastWeekChangePct = previous > 0 ? Math.round(((last - previous) / previous) * 100) : null

  return {
    available: true,
    sessions_with_rpe: scored.length,
    weeks,
    acute,
    chronic,
    acwr,
    acwr_zone: acwr !== null ? classifyAcwr(acwr) : null,
    last_week_change_pct: lastWeekChangePct,
  }
}
