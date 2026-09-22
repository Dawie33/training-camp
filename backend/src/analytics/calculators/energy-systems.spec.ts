import { classifyDomain, computeEnergySystems } from './energy-systems'

describe('classifyDomain', () => {
  it('range chaque durée dans son domaine temporel', () => {
    expect(classifyDomain(120)).toBe('power')
    expect(classifyDomain(300)).toBe('glycolytic')
    expect(classifyDomain(600)).toBe('mixed')
    expect(classifyDomain(1200)).toBe('aerobic')
    expect(classifyDomain(3600)).toBe('long_aerobic')
  })

  it('place les bornes dans le domaine supérieur', () => {
    expect(classifyDomain(180)).toBe('glycolytic')
    expect(classifyDomain(480)).toBe('mixed')
    expect(classifyDomain(900)).toBe('aerobic')
    expect(classifyDomain(1800)).toBe('long_aerobic')
  })
})

describe('computeEnergySystems', () => {
  const share = (result: ReturnType<typeof computeEnergySystems>, domain: string) =>
    result.domains.find(d => d.domain === domain)!.share_pct

  it('répartit les séances en pourcentages', () => {
    const result = computeEnergySystems([
      { duration_seconds: 120 },
      { duration_seconds: 300 },
      { duration_seconds: 600 },
      { duration_seconds: 600 },
    ])

    expect(result.total_scored_sessions).toBe(4)
    expect(share(result, 'power')).toBe(25)
    expect(share(result, 'mixed')).toBe(50)
  })

  it('ignore les séances sans durée exploitable plutôt que de les compter à zéro', () => {
    const result = computeEnergySystems([
      { duration_seconds: 600 },
      { duration_seconds: null },
      { duration_seconds: 0 },
      {},
    ])

    expect(result.total_scored_sessions).toBe(1)
    expect(share(result, 'mixed')).toBe(100)
  })

  it('signale les domaines délaissés quand le volume le permet', () => {
    const sessions = Array.from({ length: 10 }, () => ({ duration_seconds: 600 }))
    const result = computeEnergySystems(sessions)

    expect(result.underworked).toContain('power')
    expect(result.underworked).toContain('long_aerobic')
    expect(result.underworked).not.toContain('mixed')
  })

  it('ne conclut à aucun déséquilibre sur un volume trop faible', () => {
    const result = computeEnergySystems([{ duration_seconds: 600 }, { duration_seconds: 620 }])

    expect(result.underworked).toEqual([])
  })

  it('reste neutre sans aucune séance', () => {
    const result = computeEnergySystems([])

    expect(result.total_scored_sessions).toBe(0)
    expect(result.domains.every(d => d.share_pct === 0)).toBe(true)
    expect(result.underworked).toEqual([])
  })
})
