import { ValidationPipe } from '@nestjs/common'
import { CreateSkillProgramDto, CreateSkillProgressLogDto, GenerateSkillProgramDto, UpdateSkillStepDto } from './skill.dto'

const program = () => ({
  skill_name: 'Muscle-up',
  skill_category: 'gymnastics',
  steps: Array.from({ length: 4 }, (_, i) => ({ step_number: i + 1, title: `Etape ${i + 1}` })),
})

const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })
const validateProgram = (value: unknown) => pipe.transform(value, { type: 'body', metatype: CreateSkillProgramDto })

describe('Skills DTO validation', () => {
  const validateGeneration = (value: unknown) =>
    pipe.transform(value, { type: 'body', metatype: GenerateSkillProgramDto })

  it('accepts generation inputs at the size limits', async () => {
    const data = {
      skillName: 'a'.repeat(100),
      skillCategory: 'gymnastics',
      currentCapabilities: 'a'.repeat(1000),
      constraints: 'a'.repeat(1000),
      availableEquipment: Array.from({ length: 50 }, () => 'a'.repeat(100)),
    }
    await expect(validateGeneration(data)).resolves.toMatchObject(data)
  })

  it.each([
    { skillName: '' },
    { skillName: 'a'.repeat(101) },
    { currentCapabilities: 'a'.repeat(1001) },
    { constraints: 'a'.repeat(1001) },
    { availableEquipment: Array.from({ length: 51 }, () => 'barbell') },
    { availableEquipment: ['a'.repeat(101)] },
  ])('rejects oversized or empty generation input %#', async overrides => {
    await expect(
      validateGeneration({ skillName: 'Muscle-up', skillCategory: 'gymnastics', ...overrides })
    ).rejects.toMatchObject({ status: 400 })
  })

  it('accepts programming fields on nested steps', async () => {
    const data = program()
    Object.assign(data.steps[0], { frequency: '3x', when_to_train: 'Avant', warmup: 'Mobilite' })
    await expect(validateProgram(data)).resolves.toMatchObject(data)
  })

  it.each([
    { ...program(), steps: [] },
    { ...program(), steps: [{ step_number: 1 }] },
    { ...program(), steps: program().steps.map(s => ({ ...s, injected: true })) },
    { ...program(), estimated_weeks: 'abc' },
    { ...program(), steps: program().steps.map(s => ({ ...s, recommended_exercises: 'abc' })) },
  ])('rejects invalid nested program %#', async data => {
    await expect(validateProgram(data)).rejects.toMatchObject({ status: 400 })
  })

  it.each(['demain', '2026-02-30', '2026-01-01T12:00:00Z'])('rejects invalid date %s', async date => {
    await expect(
      pipe.transform(
        { step_id: 'a62758e4-7e46-49de-8426-3a24857c5cfa', session_date: date },
        { type: 'body', metatype: CreateSkillProgressLogDto }
      )
    ).rejects.toMatchObject({ status: 400 })
  })

  it('rejects nonboolean override', async () => {
    await expect(
      pipe.transform({ manually_overridden: 'true' }, { type: 'body', metatype: UpdateSkillStepDto })
    ).rejects.toMatchObject({ status: 400 })
  })
})
