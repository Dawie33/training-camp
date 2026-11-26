import { Injectable } from '@nestjs/common'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { toParisDate } from 'src/common/utils/date-only'
import type { UserAIContext } from 'src/user-context/types/user-context.types'
import { UserContextService } from 'src/user-context/user-context.service'
import { buildRecommendationSystemPrompt, buildRecommendationUserPrompt } from '../prompts/recommendation.prompt'
import {
  AIRecommendationSchema,
  NextSessionRecommendation,
  recommendedWorkoutTypes,
  SessionStats,
} from '../schemas/recommendation.schema'
import { DailyCoachStore } from './daily-coach-store.service'

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly openaiClientService: OpenAIClientService,
    private readonly userContextService: UserContextService,
    private readonly store: DailyCoachStore
  ) {}

  async getNextSessionRecommendation(
    userId: string,
    day = toParisDate(new Date())
  ): Promise<NextSessionRecommendation> {
    return this.store.run(userId, day, 'recommendation', async () => {
      const ctx = await this.userContextService.getUserAIContext(userId)
      const stats = this.computeSessionStats(ctx, day)

      const recommendation = await this.openaiClientService.createJsonCompletion({
        purpose: 'recommandation du coach',
        messages: [
          { role: 'system', content: buildRecommendationSystemPrompt() },
          { role: 'user', content: buildRecommendationUserPrompt(ctx, stats, day) },
        ],
        temperature: 0.4,
        maxOutputTokens: 800,
        schema: AIRecommendationSchema,
      })

      const result: NextSessionRecommendation = {
        recommendation,
      }

      return async () => result
    })
  }

  private computeSessionStats(ctx: UserAIContext, today = toParisDate(new Date())): SessionStats {
    let lastDate: string | null = null
    const lastDateByType: Record<string, string | null> = Object.fromEntries(
      recommendedWorkoutTypes.map(type => [type, null])
    )

    for (const s of ctx.recentSessions) {
      if (!lastDate || s.date > lastDate) lastDate = s.date
      if (s.workout_type && Object.hasOwn(lastDateByType, s.workout_type)) {
        const last = lastDateByType[s.workout_type]
        if (!last || s.date > last) lastDateByType[s.workout_type] = s.date
      }
    }

    const daysSince = (last: string | null): number | null =>
      last ? Math.floor((new Date(today).getTime() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)) : null
    return {
      total_sessions_21d: ctx.recentSessions.length,
      days_since_last: daysSince(lastDate),
      days_since_last_by_type: Object.fromEntries(
        Object.entries(lastDateByType).map(([type, last]) => [type, daysSince(last)])
      ),
    }
  }
}
