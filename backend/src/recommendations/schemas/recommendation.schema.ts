import { z } from 'zod'

export const RecommendedSportSchema = z.enum(['crossfit', 'running', 'hyrox', 'strength', 'athx', 'rest'])

export const AIRecommendationSchema = z.object({
  recommended_sport: RecommendedSportSchema,
  recommended_type: z.string().min(1),
  urgency: z.enum(['low', 'medium', 'high']),
  reason: z.string().min(1),
  coaching_insight: z.string().min(1),
  suggested_duration: z.number().int().positive(),
  suggested_focus: z.string().nullable().optional(),
  suggested_instructions: z.string().nullable().optional(),
})

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
