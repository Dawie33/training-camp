import { computeTrainingVolume, weekStart } from './training-volume'

describe('weekStart', () => {
  it('ramène chaque jour au lundi de sa semaine', () => {
    expect(weekStart(new Date('2026-09-16T14:00:00'))).toBe('2026-09-14')
    expect(weekStart(new Date('2026-09-14T06:00:00'))).toBe('2026-09-14')
  })

  it('rattache le dimanche à la semaine qui s’achève', () => {
    expect(weekStart(new Date('2026-09-20T23:00:00'))).toBe('2026-09-14')
  })
})

describe('computeTrainingVolume', () => {
  it('agrège le volume et la moyenne hebdomadaire', () => {
    const result = computeTrainingVolume([
      { started_at: '2026-09-01T10:00:00' },
      { started_at: '2026-09-03T10:00:00' },
      { started_at: '2026-09-08T10:00:00' },
      { started_at: '2026-09-15T10:00:00' },
    ])

    expect(result.total_sessions).toBe(4)
    expect(result.weeks).toHaveLength(3)
    expect(result.avg_per_week).toBeGreaterThan(0)
  })

  it('mesure la régularité sur les semaines réellement entraînées', () => {
    // Deux semaines actives sur une période qui en couvre quatre
    const result = computeTrainingVolume([
      { started_at: '2026-09-01T10:00:00' },
      { started_at: '2026-09-22T10:00:00' },
    ])

    expect(result.consistency_pct).toBeLessThan(100)
    expect(result.consistency_pct).toBeGreaterThan(0)
  })

  it('plafonne la régularité à 100 %', () => {
    const result = computeTrainingVolume([
      { started_at: '2026-09-14T10:00:00' },
      { started_at: '2026-09-16T10:00:00' },
    ])

    expect(result.consistency_pct).toBeLessThanOrEqual(100)
  })

  it('trie les semaines par ordre chronologique', () => {
    const result = computeTrainingVolume([
      { started_at: '2026-09-22T10:00:00' },
      { started_at: '2026-09-01T10:00:00' },
    ])

    expect(result.weeks[0].week_start < result.weeks[1].week_start).toBe(true)
  })

  it('ignore les dates invalides', () => {
    const result = computeTrainingVolume([
      { started_at: '2026-09-01T10:00:00' },
      { started_at: 'pas une date' },
    ])

    expect(result.total_sessions).toBe(1)
  })

  it('reste neutre sans séance', () => {
    expect(computeTrainingVolume([])).toEqual({
      total_sessions: 0,
      week_span: 0,
      avg_per_week: 0,
      consistency_pct: 0,
      weeks: [],
    })
  })
})
