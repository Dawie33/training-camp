import { z } from 'zod'

const TrendSchema = z.enum(['improving', 'stable', 'declining'])
const FitnessLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'elite'])

export const TypeTrendSchema = z.object({
  type: z.string(),
  trend: TrendSchema,
  detail: z.string(),
  session_count: z.number().int().nonnegative(),
})

export const FitnessProfileSchema = z.object({
  cardio: FitnessLevelSchema,
  strength: FitnessLevelSchema,
  work_capacity: FitnessLevelSchema,
  endurance: FitnessLevelSchema,
})

/**
 * Contrat de la partie du bilan mensuel rédigée par l'IA.
 *
 * `sport`, `period_months` et `generated_at` sont ajoutés par le backend et ne font
 * donc pas partie de ce qui est demandé au modèle.
 */
export const AIProgressionReportSchema = z.object({
  period_summary: z.string().min(1),
  overall_trend: TrendSchema,
  highlights: z.array(z.string()),
  type_trends: z.array(TypeTrendSchema),
  strengths: z.array(z.string()),
  weak_points: z.array(z.string()),
  recommendations: z.array(z.string()),
  consistency_feedback: z.string(),
  performance_highlights: z.array(z.string()).optional(),
  strength_progression: z.string().optional(),
  movement_focus: z.array(z.string()).optional(),
  fitness_profile: FitnessProfileSchema.optional(),
  overall_fitness_level: z.string().optional(),
})

export type TypeTrend = z.infer<typeof TypeTrendSchema>
export type FitnessProfile = z.infer<typeof FitnessProfileSchema>
export type AIProgressionReport = z.infer<typeof AIProgressionReportSchema>
