import { z } from 'zod'

export const ValidationCriteriaSchema = z.object({
  type: z.enum(['reps', 'time', 'weight', 'quality', 'distance', 'steps']),
  target: z.number(),
  metric: z.string(),
  unit: z.string(),
  description: z.string(),
})

export const RecommendedExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().int().positive().optional(),
  reps: z.union([z.number().int().nonnegative(), z.string()]).optional(),
  rest: z.string().optional(),
  intensity: z.string().optional(),
  notes: z.string().optional(),
})

export const SkillStepSchema = z.object({
  step_number: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  validation_criteria: ValidationCriteriaSchema,
  recommended_exercises: z.array(RecommendedExerciseSchema).min(2),
  coaching_tips: z.string().nullable().optional(),
  estimated_duration_weeks: z.number().int().positive().nullable().optional(),
  frequency: z.string().nullable().optional(),
  when_to_train: z.string().nullable().optional(),
  warmup: z.string().nullable().optional(),
})

export const GeneratedSkillProgramSchema = z
  .object({
    skill_name: z.string().min(1).max(255),
    skill_category: z.enum(['gymnastics', 'olympic_lifting', 'strength', 'mobility']),
    description: z.string().min(1),
    estimated_weeks: z.number().int().positive(),
    progression_notes: z.string(),
    safety_notes: z.string(),
    steps: z.array(SkillStepSchema).min(4).max(10),
  })
  .superRefine((program, context) => {
    if (!hasConsecutiveSteps(program.steps)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['steps'],
        message: 'Les etapes doivent etre numerotees de 1 a N dans l ordre',
      })
    }
  })

export function hasConsecutiveSteps(steps: { step_number: number }[]): boolean {
  return steps.every((step, index) => step.step_number === index + 1)
}

export type GeneratedSkillProgramValidated = z.infer<typeof GeneratedSkillProgramSchema>
