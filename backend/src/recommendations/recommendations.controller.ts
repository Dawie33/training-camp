import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RecommendationsService } from './services/recommendations.service'

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

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
