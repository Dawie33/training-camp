import { AIProgressionReportSchema } from './progression-report.schema'

const validReport = {
  period_summary: 'Mois régulier, avec un PR sur Fran.',
  overall_trend: 'improving',
  highlights: ['Fran en 4:32'],
  type_trends: [{ type: 'for_time', trend: 'improving', detail: '3 séances plus rapides', session_count: 5 }],
  strengths: ['Moteur aérobie'],
  weak_points: ['Gymnastique overhead'],
  recommendations: ['Ajouter du travail de handstand'],
  consistency_feedback: '3,5 séances par semaine.',
}

describe('AIProgressionReportSchema', () => {
  it('accepte un bilan sans les champs facultatifs', () => {
    expect(AIProgressionReportSchema.safeParse(validReport).success).toBe(true)
  })

  it('accepte un bilan avec profil de forme', () => {
    const parsed = AIProgressionReportSchema.safeParse({
      ...validReport,
      fitness_profile: { cardio: 'advanced', strength: 'intermediate', work_capacity: 'advanced', endurance: 'elite' },
    })

    expect(parsed.success).toBe(true)
  })

  it('rejette une tendance inconnue', () => {
    expect(AIProgressionReportSchema.safeParse({ ...validReport, overall_trend: 'up' }).success).toBe(false)
  })

  it('rejette un niveau de forme inconnu', () => {
    const parsed = AIProgressionReportSchema.safeParse({
      ...validReport,
      fitness_profile: { cardio: 'pro', strength: 'intermediate', work_capacity: 'advanced', endurance: 'elite' },
    })

    expect(parsed.success).toBe(false)
  })

  it('rejette un bilan sans recommandations', () => {
    const { recommendations: _recommendations, ...withoutRecommendations } = validReport

    expect(AIProgressionReportSchema.safeParse(withoutRecommendations).success).toBe(false)
  })
})
