import { EnergyDomain, EnergyDomainStat, EnergySystemsResult } from '../types/analytics.types'

export interface ScoredSession {
  /** Durée de l'effort en secondes. Les séances sans durée exploitable sont ignorées. */
  duration_seconds?: number | null
}

interface DomainDefinition {
  domain: EnergyDomain
  label: string
  range_label: string
  /** Borne haute exclusive, en secondes. */
  maxSeconds: number
}

/**
 * Domaines temporels du CrossFit. Chacun sollicite une filière dominante différente :
 * un athlète ne progresse que dans les domaines qu'il expose réellement.
 */
const DOMAINS: DomainDefinition[] = [
  { domain: 'power', label: 'Puissance', range_label: '< 3 min', maxSeconds: 180 },
  { domain: 'glycolytic', label: 'Glycolytique', range_label: '3-8 min', maxSeconds: 480 },
  { domain: 'mixed', label: 'Mixte', range_label: '8-15 min', maxSeconds: 900 },
  { domain: 'aerobic', label: 'Aérobie', range_label: '15-30 min', maxSeconds: 1800 },
  { domain: 'long_aerobic', label: 'Aérobie long', range_label: '> 30 min', maxSeconds: Number.POSITIVE_INFINITY },
]

/** Seuil sous lequel un domaine est considéré comme délaissé sur la période. */
const UNDERWORKED_THRESHOLD_PCT = 10

/**
 * Classe une durée d'effort dans son domaine temporel.
 * @param durationSeconds Durée de l'effort en secondes
 */
export function classifyDomain(durationSeconds: number): EnergyDomain {
  return (DOMAINS.find(d => durationSeconds < d.maxSeconds) ?? DOMAINS[DOMAINS.length - 1]).domain
}

/**
 * Répartit les séances par domaine temporel et signale les filières délaissées.
 *
 * Les séances sans durée exploitable sont écartées du calcul plutôt que comptées à zéro :
 * mieux vaut une répartition sur moins de séances qu'une répartition faussée.
 *
 * @param sessions Séances de la période, avec leur durée d'effort
 * @returns La répartition par domaine et les domaines sous 10 %
 */
export function computeEnergySystems(sessions: ScoredSession[]): EnergySystemsResult {
  const counts = new Map<EnergyDomain, number>(DOMAINS.map(d => [d.domain, 0]))

  let scored = 0
  for (const session of sessions) {
    const duration = session.duration_seconds
    if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) continue
    const domain = classifyDomain(duration)
    counts.set(domain, (counts.get(domain) ?? 0) + 1)
    scored += 1
  }

  const domains: EnergyDomainStat[] = DOMAINS.map(def => {
    const count = counts.get(def.domain) ?? 0
    return {
      domain: def.domain,
      label: def.label,
      range_label: def.range_label,
      session_count: count,
      share_pct: scored > 0 ? Math.round((count / scored) * 100) : 0,
    }
  })

  // Sans volume suffisant, une répartition ne veut rien dire : on ne crie pas au déséquilibre sur 3 séances.
  const underworked = scored >= 8
    ? domains.filter(d => d.share_pct < UNDERWORKED_THRESHOLD_PCT).map(d => d.domain)
    : []

  return { total_scored_sessions: scored, domains, underworked }
}
