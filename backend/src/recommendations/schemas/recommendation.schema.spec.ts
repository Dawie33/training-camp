import { AIRecommendationSchema } from './recommendation.schema'

const valid = {
  recommended_sport: 'crossfit',
  recommended_type: 'conditioning',
  urgency: 'low',
  reason: 'Rotation',
  coaching_insight: 'Endurance',
  suggested_duration: 45,
}

describe('AIRecommendationSchema', () => {
  it.each([20, 90])('accepte la borne de durée %s', suggested_duration => {
    expect(AIRecommendationSchema.safeParse({ ...valid, suggested_duration }).success).toBe(true)
  })

  it.each([19, 91, 20.5, '45', null])('refuse la durée %s', suggested_duration => {
    expect(AIRecommendationSchema.safeParse({ ...valid, suggested_duration }).success).toBe(false)
  })

  it.each(['AMRAP', 'benchmark', 'active_recovery'])('refuse le type CrossFit %s', recommended_type => {
    expect(AIRecommendationSchema.safeParse({ ...valid, recommended_type }).success).toBe(false)
  })

  it('réserve active_recovery au repos', () => {
    expect(
      AIRecommendationSchema.safeParse({
        ...valid,
        recommended_sport: 'rest',
        recommended_type: 'active_recovery',
      }).success
    ).toBe(true)
    expect(AIRecommendationSchema.safeParse({ ...valid, recommended_sport: 'rest' }).success).toBe(false)
  })
})
