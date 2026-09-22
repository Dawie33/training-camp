import { AcwrZone, TrainingLoadResult, WeeklyLoadPoint } from '../types/analytics.types'
import { weekStart } from './training-volume'

export interface RpeSession {
  started_at: string
  /** Effort perçu sur l'échelle CR-10. Les séances sans RPE sont écartées du calcul. */
  rpe?: number | null
  duration_seconds?: number | null
}

const MS_PER_DAY = 24 * 3600 * 1000
const ACUTE_WINDOW_DAYS = 7
const CHRONIC_WINDOW_DAYS = 28

/**
 * Durée retenue quand une séance porte un RPE sans durée exploitable.
 * Évite de perdre l'information d'effort ; valeur conservatrice d'une séance type.
 */
const DEFAULT_SESSION_MINUTES = 60

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

      const durationSeconds = session.duration_seconds
      const minutes = typeof durationSeconds === 'number' && durationSeconds > 0
        ? durationSeconds / 60
        : DEFAULT_SESSION_MINUTES

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

  const weeks: WeeklyLoadPoint[] = [...perWeek.entries()]
    .map(([week_start, bucket]) => ({ week_start, ...bucket }))
    .sort((a, b) => a.week_start.localeCompare(b.week_start))

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

  let lastWeekChangePct: number | null = null
  if (weeks.length >= 2) {
    const previous = weeks[weeks.length - 2].srpe
    const current = weeks[weeks.length - 1].srpe
    if (previous > 0) lastWeekChangePct = Math.round(((current - previous) / previous) * 100)
  }

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
