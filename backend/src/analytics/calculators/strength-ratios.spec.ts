import { computeStrengthRatios } from './strength-ratios'

describe('computeStrengthRatios', () => {
  const ratioOf = (result: ReturnType<typeof computeStrengthRatios>, key: string) =>
    result.ratios.find(r => r.key === key)!

  it('situe un snatch faible par rapport au clean & jerk', () => {
    const result = computeStrengthRatios({ snatch: 70, clean_and_jerk: 100 })
    const ratio = ratioOf(result, 'snatch_to_clean_and_jerk')

    expect(ratio.value_pct).toBe(70)
    expect(ratio.verdict).toBe('below')
    expect(ratio.interpretation).toContain('technique')
  })

  it('valide un snatch dans la fourchette 78-82 %', () => {
    const result = computeStrengthRatios({ snatch: 80, clean_and_jerk: 100 })

    expect(ratioOf(result, 'snatch_to_clean_and_jerk').verdict).toBe('in_range')
  })

  it('détecte un front squat en retard sur le back squat', () => {
    const result = computeStrengthRatios({ front_squat: 76, back_squat: 100 })
    const ratio = ratioOf(result, 'front_squat_to_back_squat')

    expect(ratio.value_pct).toBe(76)
    expect(ratio.verdict).toBe('below')
  })

  it('détecte un deadlift en retard malgré un ratio supérieur à 100 %', () => {
    const result = computeStrengthRatios({ deadlift: 110, back_squat: 100 })

    expect(ratioOf(result, 'deadlift_to_back_squat').verdict).toBe('below')
  })

  it('signale un C&J trop proche du back squat', () => {
    const result = computeStrengthRatios({ clean_and_jerk: 85, back_squat: 100 })
    const ratio = ratioOf(result, 'clean_and_jerk_to_back_squat')

    expect(ratio.verdict).toBe('above')
    expect(ratio.interpretation).toContain('force maximale')
  })

  it('arrondit à une décimale sans fausse précision', () => {
    const result = computeStrengthRatios({ snatch: 67, clean_and_jerk: 93 })

    expect(ratioOf(result, 'snatch_to_clean_and_jerk').value_pct).toBe(72)
  })

  it('marque un ratio indisponible et liste les lifts manquants', () => {
    const result = computeStrengthRatios({ back_squat: 140 })
    const ratio = ratioOf(result, 'snatch_to_clean_and_jerk')

    expect(ratio.value_pct).toBeNull()
    expect(ratio.verdict).toBe('unavailable')
    expect(result.missing_lifts).toEqual(expect.arrayContaining(['snatch', 'clean_and_jerk']))
    expect(result.missing_lifts).not.toContain('back_squat')
  })

  it('ne divise jamais par zéro', () => {
    const result = computeStrengthRatios({ snatch: 80, clean_and_jerk: 0 })

    expect(ratioOf(result, 'snatch_to_clean_and_jerk').verdict).toBe('unavailable')
  })

  it('retourne tous les ratios même sans aucun 1RM', () => {
    const result = computeStrengthRatios({})

    expect(result.ratios).toHaveLength(5)
    expect(result.ratios.every(r => r.verdict === 'unavailable')).toBe(true)
  })
})
