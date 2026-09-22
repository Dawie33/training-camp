import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { DailySessionService } from './services/daily-session.service'
import { RecommendationsService } from './services/recommendations.service'

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly dailySessionService: DailySessionService,
  ) {}

  /**
   * Génère et planifie la séance du jour si elle n'existe pas encore.
   * Appelé silencieusement à la connexion (voir AuthContext frontend).
   */
  @Get('daily-session/check')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async checkDailySession(@Request() req: { user: { id: string } }) {
    return this.dailySessionService.checkAndGenerateDailySession(req.user.id)
  }

  @Get('next-session')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getNextSession(@Request() req: { user: { id: string } }) {
    return this.recommendationsService.getNextSessionRecommendation(req.user.id)
  }

  @Post('next-session/refresh')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async refreshNextSession(@Request() req: { user: { id: string } }) {
    this.recommendationsService.invalidateCache(req.user.id)
    return this.recommendationsService.getNextSessionRecommendation(req.user.id)
  }
}
