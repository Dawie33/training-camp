import { BenchmarkEntry, computeBenchmarkProgress, formatScore } from './benchmark-progress'

// Un workout_id par nom par défaut : un même nom = un même workout, sauf si le test dit le contraire
const entry = (over: Partial<BenchmarkEntry> = {}): BenchmarkEntry => ({
  workout_id: `workout-${over.workout_name ?? 'Fran'}`,
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

  describe('regroupement par workout', () => {
    it('sépare deux workouts homonymes', () => {
      const progressions = computeBenchmarkProgress([
        entry({ workout_id: 'fran-box', score_value: 300, measured_at: '2026-01-10T10:00:00.000Z' }),
        entry({ workout_id: 'fran-perso', score_value: 400, measured_at: '2026-03-10T10:00:00.000Z' }),
      ])

      expect(progressions).toHaveLength(2)
      expect(progressions.map(p => p.workout_id).sort()).toEqual(['fran-box', 'fran-perso'])
      expect(progressions.every(p => p.delta_pct === null)).toBe(true)
    })

    it('réunit un même workout saisi sous deux noms, et affiche le plus récent', () => {
      const [fran] = computeBenchmarkProgress([
        entry({ workout_id: 'fran', workout_name: 'fran', score_value: 372, measured_at: '2026-01-10T10:00:00.000Z' }),
        entry({ workout_id: 'fran', workout_name: 'Fran', score_value: 320, measured_at: '2026-03-10T10:00:00.000Z' }),
      ])

      expect(fran.name).toBe('Fran')
      expect(fran.points).toHaveLength(2)
      expect(fran.trend).toBe('improving')
    })
  })

  describe('type de score', () => {
    it('exclut un score d’un autre type que celui du barème', () => {
      // Fran se mesure au temps : un score « 2 rounds » donnait +99,3 %, en progrès
      const [fran] = computeBenchmarkProgress([
        entry({ score_value: 300, measured_at: '2026-01-10T10:00:00.000Z' }),
        entry({ score_type: 'rounds', score_value: 2, measured_at: '2026-03-10T10:00:00.000Z' }),
      ])

      expect(fran.score_type).toBe('time_seconds')
      expect(fran.points).toHaveLength(1)
      expect(fran.delta_pct).toBeNull()
    })

    it('retient le type majoritaire pour un workout sans barème', () => {
      const [custom] = computeBenchmarkProgress([
        entry({ workout_name: 'WOD du samedi', score_value: 600, measured_at: '2026-01-10T10:00:00.000Z' }),
        entry({ workout_name: 'WOD du samedi', score_value: 570, measured_at: '2026-02-10T10:00:00.000Z' }),
        entry({
          workout_name: 'WOD du samedi',
          score_type: 'rounds',
          score_value: 8,
          measured_at: '2026-03-10T10:00:00.000Z',
        }),
      ])

      expect(custom.score_type).toBe('time_seconds')
      expect(custom.points.map(p => p.score_value)).toEqual([600, 570])
      expect(custom.delta_pct).toBe(5)
    })
  })

  describe('AMRAP', () => {
    const cindy = (rounds: number, extraReps: number, measuredAt: string) =>
      entry({
        workout_name: 'Cindy',
        score_type: 'rounds',
        score_value: rounds,
        extra_reps: extraReps,
        measured_at: measuredAt,
      })

    it('compte les reps supplémentaires en fraction de round', () => {
      // 15 + 2 puis 15 + 14 : 12 reps de plus sur des rounds de 30 reps, soit +2,7 %
      const [progress] = computeBenchmarkProgress([
        cindy(15, 2, '2026-01-10T10:00:00.000Z'),
        cindy(15, 14, '2026-03-10T10:00:00.000Z'),
      ])

      expect(progress.points.map(p => p.comparable_value)).toEqual([15.07, 15.47])
      expect(progress.delta_pct).toBe(2.7)
      // Sous le seuil de 3 % : un vrai progrès, mais encore dans la variation normale d'un test
      expect(progress.trend).toBe('stable')
    })

    it('détecte un progrès porté par les reps supplémentaires', () => {
      const [progress] = computeBenchmarkProgress([
        cindy(15, 0, '2026-01-10T10:00:00.000Z'),
        cindy(15, 25, '2026-03-10T10:00:00.000Z'),
      ])

      expect(progress.trend).toBe('improving')
    })

    it('se rabat sur 100 reps par round pour un AMRAP sans barème', () => {
      const [custom] = computeBenchmarkProgress([
        entry({ workout_name: 'AMRAP 12', score_type: 'rounds', score_value: 5, extra_reps: 8 }),
      ])

      expect(custom.points[0].comparable_value).toBe(5.08)
    })
  })

  it('garde la bande débutant de Cindy, qui a un vrai seuil', () => {
    const [cindy] = computeBenchmarkProgress([entry({ workout_name: 'Cindy', score_type: 'rounds', score_value: 12 })])

    expect(cindy.bands!.map(b => b.level)).toEqual(['beginner', 'intermediate', 'advanced', 'elite'])
    expect(cindy.bands![0].display).toBe('8 rounds')
  })
})
