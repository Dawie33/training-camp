import { computeSkillProgress } from './skill-progress'

const program = (id: string, name: string) => ({
  program_id: id,
  skill_name: name,
  skill_category: 'gymnastics',
})

const step = (programId: string, title: string, status: string) => ({
  program_id: programId,
  title,
  status,
})

describe('computeSkillProgress', () => {
  it('calcule le pourcentage d’avancement et l’étape en cours', () => {
    const result = computeSkillProgress(
      [program('p1', 'Muscle Up')],
      [
        step('p1', 'Ring rows', 'completed'),
        step('p1', 'Négatives', 'completed'),
        step('p1', 'Strict pull-up', 'in_progress'),
        step('p1', 'Bar muscle-up', 'locked'),
      ]
    )

    expect(result.available).toBe(true)
    expect(result.skills[0].progress_pct).toBe(50)
    expect(result.skills[0].completed_steps).toBe(2)
    expect(result.skills[0].total_steps).toBe(4)
    expect(result.skills[0].current_step_title).toBe('Strict pull-up')
  })

  it('compte une étape sautée comme franchie', () => {
    const result = computeSkillProgress(
      [program('p1', 'Handstand')],
      [step('p1', 'Pike push-up', 'skipped'), step('p1', 'Box HSPU', 'locked')]
    )

    expect(result.skills[0].completed_steps).toBe(1)
    expect(result.skills[0].progress_pct).toBe(50)
  })

  it('laisse l’étape en cours nulle quand aucune n’est ouverte', () => {
    const result = computeSkillProgress(
      [program('p1', 'Double Under')],
      [step('p1', 'Single unders', 'completed')]
    )

    expect(result.skills[0].current_step_title).toBeNull()
    expect(result.skills[0].progress_pct).toBe(100)
  })

  it('classe les programmes du plus avancé au moins avancé', () => {
    const result = computeSkillProgress(
      [program('p1', 'Muscle Up'), program('p2', 'Handstand Walk')],
      [
        step('p1', 'A', 'locked'),
        step('p2', 'B', 'completed'),
        step('p2', 'C', 'completed'),
      ]
    )

    expect(result.skills.map(s => s.skill_name)).toEqual(['Handstand Walk', 'Muscle Up'])
  })

  it('ne divise pas par zéro sur un programme sans étape', () => {
    const result = computeSkillProgress([program('p1', 'Snatch')], [])

    expect(result.skills[0].progress_pct).toBe(0)
    expect(result.skills[0].total_steps).toBe(0)
  })

  it('signale l’indisponibilité sans programme actif', () => {
    expect(computeSkillProgress([], [])).toEqual({ available: false, skills: [] })
  })
})
