import { Logger } from '@nestjs/common'
import { z } from 'zod'

export const GlobalGoalsSchema = z
  .object({
    weight_loss: z.boolean().optional(),
    muscle_gain: z.boolean().optional(),
    endurance: z.boolean().optional(),
    strength: z.boolean().optional(),
    flexibility: z.boolean().optional(),
    performance: z.boolean().optional(),
  })
  .strict()

export const TrainingPreferencesSchema = z
  .object({
    preferred_duration: z.number().int().min(20).max(90).optional(),
    sessions_per_week: z.number().int().min(1).max(7).optional(),
  })
  .strict()

// Restrictions fonctionnelles non douloureuses ; les blessures restent dans injuries.
export const PhysicalLimitationsSchema = z
  .array(
    z
      .string()
      .min(1)
      .max(300)
      .refine(value => value.trim().length > 0)
  )
  .max(10)

export const AVAILABLE_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export const SchedulePreferencesSchema = z
  .object({
    available_days: z
      .array(z.enum(AVAILABLE_DAYS))
      .max(7)
      .refine(days => new Set(days).size === days.length, 'Les jours doivent etre uniques')
      .optional(),
  })
  .strict()

export type GlobalGoals = z.infer<typeof GlobalGoalsSchema>
export type TrainingPreferences = z.infer<typeof TrainingPreferencesSchema>
export type SchedulePreferences = z.infer<typeof SchedulePreferencesSchema>

const logger = new Logger('Profile')

/** Une lecture historique invalide ne doit pas bloquer la generation, ni reecrire la base. */
export function readStoredProfileField<T>(schema: z.ZodType<T>, value: unknown, fallback: T, field: string): T {
  if (value == null) return fallback
  const parsed = schema.safeParse(value)
  if (parsed.success) return parsed.data
  logger.warn(`Champ historique ${field} invalide ignore dans le contexte IA`)
  return fallback
}

export const StoredGoalsSchema = z.record(z.boolean())
export const StoredLimitationsSchema = z.union([z.array(z.string()), z.record(z.unknown())])
