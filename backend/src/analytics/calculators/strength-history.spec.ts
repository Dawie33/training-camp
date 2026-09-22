import { computeStrengthHistory } from './strength-history'

const entry = (lift: string, value: number, measured_at: string) => ({ lift, value, measured_at })

describe('computeStrengthHistory', () => {
  it('construit une série par lift, du plus lourd au plus léger', () => {
    const result = computeStrengthHistory([
      entry('strict_press', 50, '2026-01-10T10:00:00.000Z'),
      entry('back_squat', 140, '2026-01-10T10:00:00.000Z'),
    ])

    expect(result.available).toBe(true)
    expect(result.lifts.map(l => l.lift)).toEqual(['back_squat', 'strict_press'])
  })

  it('calcule le gain en kg et en pourcentage', () => {
    const [squat] = computeStrengthHistory([
      entry('back_squat', 120, '2026-01-10T10:00:00.000Z'),
      entry('back_squat', 135, '2026-06-10T10:00:00.000Z'),
    ]).lifts

    expect(squat.current).toBe(135)
    expect(squat.gain_kg).toBe(15)
    expect(squat.gain_pct).toBe(12.5)
    expect(squat.trend).toBe('improving')
  })

  it('ordonne les points du plus ancien au plus récent', () => {
    const [squat] = computeStrengthHistory([
      entry('back_squat', 135, '2026-06-10T10:00:00.000Z'),
      entry('back_squat', 120, '2026-01-10T10:00:00.000Z'),
    ]).lifts

    expect(squat.points.map(p => p.value)).toEqual([120, 135])
  })

  it('retient le meilleur relevé même s’il n’est pas le dernier', () => {
    const [squat] = computeStrengthHistory([
      entry('back_squat', 140, '2026-01-10T10:00:00.000Z'),
      entry('back_squat', 130, '2026-06-10T10:00:00.000Z'),
    ]).lifts

    expect(squat.best).toBe(140)
    expect(squat.current).toBe(130)
    expect(squat.trend).toBe('declining')
  })

  it('laisse le gain nul sur un relevé unique', () => {
    const [squat] = computeStrengthHistory([entry('back_squat', 120, '2026-01-10T10:00:00.000Z')]).lifts

    expect(squat.gain_kg).toBeNull()
    expect(squat.gain_pct).toBeNull()
    expect(squat.trend).toBe('stable')
  })

  it('ignore les valeurs non exploitables', () => {
    const result = computeStrengthHistory([
      entry('back_squat', 0, '2026-01-10T10:00:00.000Z'),
      entry('deadlift', Number.NaN, '2026-01-10T10:00:00.000Z'),
      entry('snatch', 70, '2026-01-10T10:00:00.000Z'),
    ])

    expect(result.lifts.map(l => l.lift)).toEqual(['snatch'])
  })

  it('signale l’indisponibilité sans aucun relevé', () => {
    expect(computeStrengthHistory([])).toEqual({ available: false, lifts: [] })
  })
})
