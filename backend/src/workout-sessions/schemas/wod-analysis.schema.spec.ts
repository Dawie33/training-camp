import { WodAnalysisSchema } from './wod-analysis.schema'

const validAnalysis = {
  summary: 'Belle séance, rythme régulier sur les thrusters.',
  performance_level: 'above_average',
  comparison: '12 secondes de mieux que la dernière fois.',
  strengths: ['Transitions rapides'],
  improvements: ['Pull-ups fractionnés trop tôt'],
  next_steps: 'Travailler les séries de pull-ups en EMOM.',
}

describe('WodAnalysisSchema', () => {
  it('accepte une analyse complète', () => {
    expect(WodAnalysisSchema.safeParse(validAnalysis).success).toBe(true)
  })

  it('accepte une comparaison nulle pour une première fois', () => {
    const parsed = WodAnalysisSchema.safeParse({ ...validAnalysis, performance_level: 'first_time', comparison: null })

    expect(parsed.success).toBe(true)
  })

  it('rejette un niveau de performance inconnu', () => {
    const parsed = WodAnalysisSchema.safeParse({ ...validAnalysis, performance_level: 'excellent' })

    expect(parsed.success).toBe(false)
  })

  it('rejette une analyse sans résumé', () => {
    const { summary: _summary, ...withoutSummary } = validAnalysis

    expect(WodAnalysisSchema.safeParse(withoutSummary).success).toBe(false)
  })
})
