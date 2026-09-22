import { computeMovementExposure } from './movement-exposure'

describe('computeMovementExposure', () => {
  const find = (result: ReturnType<typeof computeMovementExposure>, name: string) =>
    result.movements.find(m => m.name === name)!

  it('agrège expositions, reps et charges par mouvement', () => {
    const result = computeMovementExposure([
      { name: 'Thruster', load_kg: 40, reps_completed: 30, scaled: false },
      { name: 'Thruster', load_kg: 45, reps_completed: 21, scaled: false },
    ])

    const thruster = find(result, 'Thruster')
    expect(thruster.exposures).toBe(2)
    expect(thruster.total_reps).toBe(51)
    expect(thruster.avg_load_kg).toBe(42.5)
    expect(thruster.max_load_kg).toBe(45)
  })

  it('exprime la charge moyenne en pourcentage du 1RM', () => {
    const result = computeMovementExposure(
      [{ name: 'Back Squat', load_kg: 90, reps_completed: 15, scaled: false }],
      { back_squat: 150 }
    )

    expect(find(result, 'Back Squat').pct_of_1rm).toBe(60)
  })

  it('reste exploitable sans 1RM correspondant', () => {
    const result = computeMovementExposure([
      { name: 'Wall Ball', load_kg: 9, reps_completed: 60, scaled: false },
    ])

    const wallBall = find(result, 'Wall Ball')
    expect(wallBall.pct_of_1rm).toBeNull()
    expect(wallBall.exposures).toBe(1)
  })

  it('rapproche les variantes d’écriture d’un même mouvement', () => {
    const result = computeMovementExposure([
      { name: 'Back Squat', load_kg: 100, scaled: false },
      { name: 'back squat', load_kg: 110, scaled: false },
      { name: 'Back-Squat', load_kg: 120, scaled: false },
    ])

    expect(result.movements).toHaveLength(1)
    expect(result.movements[0].exposures).toBe(3)
  })

  it('signale les mouvements scalés plus d’une fois sur deux', () => {
    const result = computeMovementExposure([
      { name: 'Ring Muscle Up', scaled: true },
      { name: 'Ring Muscle Up', scaled: true },
      { name: 'Ring Muscle Up', scaled: false },
      { name: 'Air Squat', scaled: false },
      { name: 'Air Squat', scaled: false },
      { name: 'Air Squat', scaled: false },
    ])

    expect(result.most_scaled).toEqual(['Ring Muscle Up'])
    expect(find(result, 'Ring Muscle Up').scaled_pct).toBe(67)
  })

  it('ne conclut pas sur un mouvement vu moins de trois fois', () => {
    const result = computeMovementExposure([
      { name: 'Handstand Walk', scaled: true },
      { name: 'Handstand Walk', scaled: true },
    ])

    expect(result.most_scaled).toEqual([])
  })

  it('classe les mouvements du plus exposé au moins exposé', () => {
    const result = computeMovementExposure([
      { name: 'Snatch', scaled: false },
      { name: 'Pull Up', scaled: false },
      { name: 'Pull Up', scaled: false },
    ])

    expect(result.movements[0].name).toBe('Pull Up')
  })

  it('signale l’indisponibilité sans aucun exercice structuré', () => {
    const result = computeMovementExposure([])

    expect(result.available).toBe(false)
    expect(result.movements).toEqual([])
  })
})
