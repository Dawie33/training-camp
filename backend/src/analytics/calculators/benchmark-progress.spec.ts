import { BenchmarkEntry, computeBenchmarkProgress, formatScore } from './benchmark-progress'

const entry = (over: Partial<BenchmarkEntry> = {}): BenchmarkEntry => ({
  workout_name: 'Fran',
  score_type: 'time_seconds',
  score_value: 300,
  extra_reps: null,
  calculated_level: 'intermediate',
  measured_at: '2026-01-10T10:00:00.000Z',
  ...over,
})

describe('formatScore', () => {
  it('formate un temps en minutes:secondes', () => {
    expect(formatScore('time_seconds', 372)).toBe('6:12')
    expect(formatScore('time_seconds', 300)).toBe('5:00')
    expect(formatScore('time_seconds', 65)).toBe('1:05')
  })

  it('formate les rounds avec leurs reps bonus', () => {
    expect(formatScore('rounds', 18, 12)).toBe('18 rounds + 12')
    expect(formatScore('rounds', 18, null)).toBe('18 rounds')
  })

  it('formate une charge en kg', () => {
    expect(formatScore('weight', 92.5)).toBe('92.5 kg')
  })
})

describe('computeBenchmarkProgress', () => {
  it('compte une baisse de temps comme une progression', () => {
    const [fran] = computeBenchmarkProgress([
      entry({ score_value: 372, measured_at: '2026-01-10T10:00:00.000Z' }),
      entry({ score_value: 320, measured_at: '2026-03-10T10:00:00.000Z' }),
    ])

    expect(fran.lower_is_better).toBe(true)
    expect(fran.trend).toBe('improving')
    expect(fran.delta_pct).toBeGreaterThan(0)
  })

  it('compte une hausse de rounds comme une progression', () => {
    const [cindy] = computeBenchmarkProgress([
      entry({ workout_name: 'Cindy', score_type: 'rounds', score_value: 15, measured_at: '2026-01-10T10:00:00.000Z' }),
      entry({ workout_name: 'Cindy', score_type: 'rounds', score_value: 19, measured_at: '2026-03-10T10:00:00.000Z' }),
    ])

    expect(cindy.lower_is_better).toBe(false)
    expect(cindy.trend).toBe('improving')
  })

  it('ne compare jamais deux workouts différents entre eux', () => {
    const progressions = computeBenchmarkProgress([
      entry({ workout_name: 'Fran', score_value: 300 }),
      entry({ workout_name: 'Murph', score_value: 3000 }),
    ])

    expect(progressions).toHaveLength(2)
    expect(progressions.every(p => p.delta_pct === null)).toBe(true)
    expect(progressions.every(p => p.trend === 'stable')).toBe(true)
  })

  it('reste stable sous le seuil de bruit', () => {
    const [fran] = computeBenchmarkProgress([
      entry({ score_value: 300, measured_at: '2026-01-10T10:00:00.000Z' }),
      entry({ score_value: 296, measured_at: '2026-03-10T10:00:00.000Z' }),
    ])

    expect(fran.trend).toBe('stable')
  })

  it('détecte une régression', () => {
    const [fran] = computeBenchmarkProgress([
      entry({ score_value: 300, measured_at: '2026-01-10T10:00:00.000Z' }),
      entry({ score_value: 360, measured_at: '2026-03-10T10:00:00.000Z' }),
    ])

    expect(fran.trend).toBe('declining')
    expect(fran.delta_pct).toBeLessThan(0)
  })

  it('ordonne les points du plus ancien au plus récent', () => {
    const [fran] = computeBenchmarkProgress([
      entry({ score_value: 320, measured_at: '2026-03-10T10:00:00.000Z' }),
      entry({ score_value: 372, measured_at: '2026-01-10T10:00:00.000Z' }),
    ])

    expect(fran.points.map(p => p.score_value)).toEqual([372, 320])
  })

  it('attache les bandes de niveau des benchmarks connus', () => {
    const [fran] = computeBenchmarkProgress([entry()])

    expect(fran.bands).not.toBeNull()
    expect(fran.bands!.map(b => b.level)).toEqual(['intermediate', 'advanced', 'elite'])
    expect(fran.bands!.find(b => b.level === 'elite')!.display).toBe('2:30')
  })

  it('laisse les bandes nulles pour un workout sans barème', () => {
    const [custom] = computeBenchmarkProgress([entry({ workout_name: 'WOD du samedi' })])

    expect(custom.bands).toBeNull()
  })

  it('classe les benchmarks les plus récemment testés en premier', () => {
    const progressions = computeBenchmarkProgress([
      entry({ workout_name: 'Fran', measured_at: '2026-01-10T10:00:00.000Z' }),
      entry({ workout_name: 'Grace', measured_at: '2026-05-10T10:00:00.000Z' }),
    ])

    expect(progressions[0].name).toBe('Grace')
  })

  it('accepte un historique vide', () => {
    expect(computeBenchmarkProgress([])).toEqual([])
  })
})
