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

  describe('1RM estimés', () => {
    const sourced = (value: number, measured_at: string, source: 'real' | 'estimated') => ({
      ...entry('back_squat', value, measured_at),
      source,
    })

    it('ne compte pas l’écart entre une estimation et un vrai test comme une perte', () => {
      // Estimé à 100 kg depuis un 5RM, puis testé à 97 kg : aucune perte de force mesurée
      const [squat] = computeStrengthHistory([
        sourced(100, '2026-01-10T10:00:00.000Z', 'estimated'),
        sourced(97, '2026-03-10T10:00:00.000Z', 'real'),
      ]).lifts

      expect(squat.current).toBe(97)
      expect(squat.current_estimated).toBe(false)
      expect(squat.gain_kg).toBeNull()
      expect(squat.trend).toBe('stable')
      expect(squat.points.map(p => p.estimated)).toEqual([true, false])
    })

    it('compare un vrai test au précédent vrai test, en sautant les estimations', () => {
      const [squat] = computeStrengthHistory([
        sourced(120, '2026-01-10T10:00:00.000Z', 'real'),
        sourced(140, '2026-02-10T10:00:00.000Z', 'estimated'),
        sourced(125, '2026-03-10T10:00:00.000Z', 'real'),
      ]).lifts

      expect(squat.gain_kg).toBe(5)
      expect(squat.trend).toBe('improving')
    })

    it('compare les estimations entre elles quand le 1RM actuel est estimé', () => {
      const [squat] = computeStrengthHistory([
        sourced(130, '2026-01-10T10:00:00.000Z', 'real'),
        sourced(120, '2026-02-10T10:00:00.000Z', 'estimated'),
        sourced(124, '2026-03-10T10:00:00.000Z', 'estimated'),
      ]).lifts

      expect(squat.current_estimated).toBe(true)
      expect(squat.gain_kg).toBe(4)
    })

    it('considère comme réel un relevé sans source', () => {
      const [squat] = computeStrengthHistory([entry('back_squat', 120, '2026-01-10T10:00:00.000Z')]).lifts

      expect(squat.current_estimated).toBe(false)
    })
  })
})
