import { apiClient } from './apiClient'

export type RecommendedSport = 'crossfit' | 'running' | 'hyrox' | 'strength' | 'athx' | 'rest'

export interface AIRecommendation {
  recommended_sport: RecommendedSport
  recommended_type: string
  urgency: 'low' | 'medium' | 'high'
  reason: string
  coaching_insight: string
  suggested_duration: number
  suggested_focus?: string | null
  suggested_instructions?: string | null
}

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

export const recommendationsService = {
  getNextSession: (): Promise<NextSessionRecommendation> =>
    apiClient.get('/recommendations/next-session'),

  refresh: (): Promise<NextSessionRecommendation> =>
    apiClient.post('/recommendations/next-session/refresh', {}),
}
