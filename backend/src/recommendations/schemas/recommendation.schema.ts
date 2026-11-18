import { z } from 'zod'

export const RecommendedSportSchema = z.enum(['crossfit', 'rest'])

const recommendationFields = {
  urgency: z.enum(['low', 'medium', 'high']),
  reason: z.string().min(1),
  coaching_insight: z.string().min(1),
  suggested_duration: z.number().int().min(20).max(90),
  suggested_focus: z.string().max(500).nullable().optional(),
  suggested_instructions: z.string().max(2000).nullable().optional(),
}

export const AIRecommendationSchema = z.discriminatedUnion('recommended_sport', [
  z.object({
    ...recommendationFields,
    recommended_sport: z.literal('crossfit'),
    recommended_type: z.enum(['technique_metcon', 'strength_max', 'conditioning', 'vo2max', 'core']),
  }),
  z.object({
    ...recommendationFields,
    recommended_sport: z.literal('rest'),
    recommended_type: z.literal('active_recovery'),
  }),
])

export type AIRecommendation = z.infer<typeof AIRecommendationSchema>

export interface SessionStats {
  total_sessions_21d: number
  by_sport: Record<string, number>
  days_since_last: Record<string, number | null>
}

export interface NextSessionRecommendation {
  recommendation: AIRecommendation
  session_stats: SessionStats
  generated_at: string
}
