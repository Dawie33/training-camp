import { GeneratedSkillProgramSchema } from './skill-program.schema'

const program = () => ({
  skill_name: 'Muscle-up',
  skill_category: 'gymnastics',
  description: 'Programme',
  estimated_weeks: 4,
  progression_notes: '',
  safety_notes: '',
  steps: Array.from({ length: 4 }, (_, i) => ({
    step_number: i + 1,
    title: `Etape ${i + 1}`,
    description: 'Progression',
    validation_criteria: { type: 'reps', target: 5, metric: 'reps', unit: 'reps', description: 'Strict' },
    recommended_exercises: [{ name: 'Pull-up' }, { name: 'Dip' }],
  })),
})

describe('GeneratedSkillProgramSchema', () => {
  it('accepts consecutive steps matching the prompt', () => {
    expect(GeneratedSkillProgramSchema.safeParse(program()).success).toBe(true)
  })
  it.each([
    [1, 2, 2, 4],
    [1, 2, 4, 5],
    [2, 1, 3, 4],
  ])('rejects numbering %j', (...numbers) => {
    const data = program()
    data.steps.forEach((s, i) => {
      s.step_number = numbers[i]
    })
    expect(GeneratedSkillProgramSchema.safeParse(data).success).toBe(false)
  })
  it('rejects too few steps or exercises', () => {
    const data = program()
    data.steps.pop()
    expect(GeneratedSkillProgramSchema.safeParse(data).success).toBe(false)
    const other = program()
    other.steps[0].recommended_exercises.pop()
    expect(GeneratedSkillProgramSchema.safeParse(other).success).toBe(false)
  })
  it('rejects more than ten steps', () => {
    const data = program()
    data.steps = Array.from({ length: 11 }, (_, i) => ({ ...data.steps[0], step_number: i + 1 }))
    expect(GeneratedSkillProgramSchema.safeParse(data).success).toBe(false)
  })
})
