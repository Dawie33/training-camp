import { BadRequestException, Injectable } from '@nestjs/common'
import OpenAI from 'openai'
import { UserAIContext, UserContextService } from 'src/workouts/services/user-context.service'
import { ZodError } from 'zod'
import { buildRecommendationSystemPrompt, buildRecommendationUserPrompt } from '../prompts/recommendation.prompt'
import { AIRecommendationSchema, NextSessionRecommendation, SessionStats } from '../schemas/recommendation.schema'

@Injectable()
export class RecommendationsService {
  private readonly openai: OpenAI
  private readonly cache = new Map<string, { data: NextSessionRecommendation; expiresAt: number }>()
  private readonly TTL_MS = 2 * 60 * 60 * 1000 // 2h

  constructor(private readonly userContextService: UserContextService) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is not set')
    this.openai = new OpenAI({ apiKey })
  }

  async getNextSessionRecommendation(userId: string): Promise<NextSessionRecommendation> {
    const cached = this.cache.get(userId)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }

    try {
      const ctx = await this.userContextService.getUserAIContext(userId)
      const stats = this.computeSessionStats(ctx)

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: buildRecommendationSystemPrompt() },
          { role: 'user', content: buildRecommendationUserPrompt(ctx, stats) },
        ],
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0]?.message?.content
      if (!content) throw new BadRequestException('No response from AI')

      const recommendation = AIRecommendationSchema.parse(JSON.parse(content))

      const result: NextSessionRecommendation = {
        recommendation,
        session_stats: stats,
        generated_at: new Date().toISOString(),
      }

      this.cache.set(userId, { data: result, expiresAt: Date.now() + this.TTL_MS })
      return result
    } catch (error) {
      if (error instanceof SyntaxError) throw new BadRequestException('AI generated invalid JSON')
      if (error instanceof ZodError) {
        throw new BadRequestException(`Recommendation validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      }
      throw new BadRequestException(`Failed to generate recommendation: ${(error as Error).message}`)
    }
  }

  invalidateCache(userId: string): void {
    this.cache.delete(userId)
  }

  private computeSessionStats(ctx: UserAIContext): SessionStats {
    const ALL_SPORTS = ['crossfit', 'running', 'biking', 'strength'] as const

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