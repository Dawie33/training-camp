import { SessionResultsSchema } from './session-results.schema'

describe('SessionResultsSchema', () => {
  it('accepte un payload structuré complet', () => {
    const parsed = SessionResultsSchema.safeParse({
      elapsed_time_seconds: 372,
      rating: 4,
      rpe: 8,
      exercise_results: [
        { name: 'Thruster', section_type: 'for_time', load_kg: 42.5, reps_completed: 45, scaled: false },
        { name: 'Pull-up', section_type: 'for_time', reps_completed: 45, scaled: true, scaling_note: 'bande verte' },
      ],
    })

    expect(parsed.success).toBe(true)
  })

  it('conserve les clés historiques non décrites par le contrat', () => {
    const parsed = SessionResultsSchema.parse({
      elapsed_time_seconds: 900,
      exercise_details: { Thruster: '42.5kg' },
      coros: { totals: { calories: 310 } },
      block_progress: { 'block-1': true },
    })

    expect(parsed.exercise_details).toEqual({ Thruster: '42.5kg' })
    expect(parsed.coros).toEqual({ totals: { calories: 310 } })
    expect(parsed.block_progress).toEqual({ 'block-1': true })
  })

  it('rejette un RPE hors de l’échelle 1-10', () => {
    expect(SessionResultsSchema.safeParse({ rpe: 11 }).success).toBe(false)
    expect(SessionResultsSchema.safeParse({ rpe: 0 }).success).toBe(false)
  })

  it('rejette une charge négative', () => {
    const parsed = SessionResultsSchema.safeParse({
      exercise_results: [{ name: 'Snatch', section_type: 'strength', load_kg: -10, scaled: false }],
    })

    expect(parsed.success).toBe(false)
  })

  it('exige le drapeau scaled sur chaque exercice', () => {
    const parsed = SessionResultsSchema.safeParse({
      exercise_results: [{ name: 'Snatch', section_type: 'strength', load_kg: 60 }],
    })

    expect(parsed.success).toBe(false)
  })

  it('accepte deux fois le même mouvement dans des sections différentes', () => {
    const parsed = SessionResultsSchema.safeParse({
      exercise_results: [
        { name: 'Thruster', section_type: 'strength', load_kg: 70, sets_completed: 5, scaled: false },
        { name: 'Thruster', section_type: 'metcon', load_kg: 42.5, reps_completed: 30, scaled: false },
      ],
    })

    expect(parsed.success).toBe(true)
  })

  it('accepte un payload vide', () => {
    expect(SessionResultsSchema.safeParse({}).success).toBe(true)
  })
})
