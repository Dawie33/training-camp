import { Injectable } from '@nestjs/common'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { UserAIContext, UserContextService } from 'src/workouts/services/user-context.service'
import { buildRecommendationSystemPrompt, buildRecommendationUserPrompt } from '../prompts/recommendation.prompt'
import { AIRecommendationSchema, NextSessionRecommendation, SessionStats } from '../schemas/recommendation.schema'

@Injectable()
export class RecommendationsService {
  private readonly cache = new Map<string, { data: NextSessionRecommendation; expiresAt: number }>()
  private readonly TTL_MS = 2 * 60 * 60 * 1000 // 2h

  constructor(
    private readonly openaiClientService: OpenAIClientService,
    private readonly userContextService: UserContextService,
  ) {}

  async getNextSessionRecommendation(userId: string): Promise<NextSessionRecommendation> {
    const cached = this.cache.get(userId)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }

    const ctx = await this.userContextService.getUserAIContext(userId)
    const stats = this.computeSessionStats(ctx)

    const recommendation = await this.openaiClientService.createJsonCompletion({
      purpose: 'recommandation du coach',
      messages: [
        { role: 'system', content: buildRecommendationSystemPrompt() },
        { role: 'user', content: buildRecommendationUserPrompt(ctx, stats) },
      ],
      temperature: 0.4,
      maxOutputTokens: 800,
      schema: AIRecommendationSchema,
    })

    const result: NextSessionRecommendation = {
      recommendation,
      session_stats: stats,
      generated_at: new Date().toISOString(),
    }

    this.cache.set(userId, { data: result, expiresAt: Date.now() + this.TTL_MS })
    return result
  }

  private computeSessionStats(ctx: UserAIContext): SessionStats {
    const ALL_SPORTS = ['crossfit'] as const

    const bySport: Record<string, number> = {}
    const lastDateBySport: Record<string, string | null> = {}

    for (const sport of ALL_SPORTS) {
      bySport[sport] = 0
      lastDateBySport[sport] = null
    }

    for (const s of ctx.recentSessions) {
      bySport[s.sport] = (bySport[s.sport] ?? 0) + 1
      if (!lastDateBySport[s.sport] || s.date > lastDateBySport[s.sport]!) {
        lastDateBySport[s.sport] = s.date
      }
    }

    const today = new Date().toISOString().split('T')[0]
    const daysSinceLast: Record<string, number | null> = {}
    for (const sport of ALL_SPORTS) {
      const last = lastDateBySport[sport]
      if (!last) {
        daysSinceLast[sport] = null
      } else {
        const diffMs = new Date(today).getTime() - new Date(last).getTime()
        daysSinceLast[sport] = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      }
    }

    return {
      total_sessions_21d: ctx.recentSessions.length,
      by_sport: bySport,
      days_since_last: daysSinceLast,
    }
  }
}