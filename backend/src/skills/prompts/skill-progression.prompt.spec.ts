import { buildSkillProgressionUserPrompt, SkillProgressionParams } from './skill-progression.prompt'
import type { RatioImbalance } from 'src/workouts/services/user-context.service'

const SNATCH_TOO_LOW: RatioImbalance = {
  label: 'Snatch / Clean & Jerk',
  value_pct: 70,
  target: '78-82 %',
  direction: 'below',
  reading: 'Snatch bas par rapport au C&J : la limite est technique.',
}

/**
 * Paramètres minimaux valides, surchargeables par test.
 */
function buildParams(overrides: Partial<SkillProgressionParams> = {}): SkillProgressionParams {
  return {
    skillName: 'Squat Snatch',
    skillCategory: 'olympic_lifting',
    ...overrides,
  }
}

describe('buildSkillProgressionUserPrompt', () => {
  it('haltérophilie avec un déséquilibre → injecte le ratio, son sens et la consigne', () => {
    const prompt = buildSkillProgressionUserPrompt(buildParams({ strengthImbalances: [SNATCH_TOO_LOW] }))

    expect(prompt).toContain('Desequilibres de force mesures')
    expect(prompt).toContain('Snatch / Clean & Jerk : 70 %, trop bas (cible 78-82 %)')
    expect(prompt).toContain('Ignore les desequilibres sans lien avec Squat Snatch')
  })

  it('force avec un déséquilibre → injecte aussi le ratio', () => {
    const prompt = buildSkillProgressionUserPrompt(
      buildParams({ skillName: 'Back Squat', skillCategory: 'strength', strengthImbalances: [SNATCH_TOO_LOW] })
    )

    expect(prompt).toContain('Desequilibres de force mesures')
  })

  it("gymnastique → ignore les ratios de force, qui n'ont pas de sens pour ce skill", () => {
    const prompt = buildSkillProgressionUserPrompt(
      buildParams({ skillName: 'Muscle-Up', skillCategory: 'gymnastics', strengthImbalances: [SNATCH_TOO_LOW] })
    )

    expect(prompt).not.toContain('Desequilibres de force mesures')
  })

  it('aucun déséquilibre → pas de section vide', () => {
    const prompt = buildSkillProgressionUserPrompt(buildParams({ strengthImbalances: [] }))

    expect(prompt).not.toContain('Desequilibres de force mesures')
  })
})
