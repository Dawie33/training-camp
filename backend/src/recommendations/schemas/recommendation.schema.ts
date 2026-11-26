import { z } from 'zod'

export const RecommendedSportSchema = z.enum(['crossfit', 'rest'])

export const recommendedWorkoutTypes = ['technique_metcon', 'strength_max', 'conditioning', 'vo2max', 'core'] as const

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
    recommended_type: z.enum(recommendedWorkoutTypes),
  }),
  z.object({
    ...recommendationFields,
    recommended_sport: z.literal('rest'),
    recommended_type: z.literal('active_recovery'),
  }),
])

export type AIRecommendation = z.infer<typeof AIRecommendationSchema>

// Les snapshots historiques précèdent les bornes actuelles de génération IA.
export const CoachRecommendationSnapshotSchema = z.object({
  recommended_type: z.string().min(1),
  urgency: recommendationFields.urgency,
  reason: recommendationFields.reason,
  coaching_insight: recommendationFields.coaching_insight,
  suggested_duration: z.number().int().positive(),
})

export const CoachProposalSchema = CoachRecommendationSnapshotSchema.extend({
  workout_id: z.string().min(1).nullable(),
  workout_name: z.string().min(1).nullable(),
})

export type CoachRecommendationSnapshot = z.infer<typeof CoachRecommendationSnapshotSchema>
export type CoachProposal = z.infer<typeof CoachProposalSchema>

export interface SessionStats {
  total_sessions_21d: number
  by_sport: Record<string, number>
  days_since_last: Record<string, number | null>
  days_since_last_by_type: Record<string, number | null>
}

export interface NextSessionRecommendation {
  recommendation: AIRecommendation
  session_stats: SessionStats
  generated_at: string
}
