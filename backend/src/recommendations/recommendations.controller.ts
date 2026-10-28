import { Controller, Post, Request, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { DailySessionService } from './services/daily-session.service'

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly dailySessionService: DailySessionService) {}

  /**
   * Génère et planifie la séance du jour si elle n'existe pas encore.
   * Appelé par la carte « Séance du jour » du dashboard (TodaySessionCard).
   * En POST car la route génère une séance par IA (un GET peut être rejoué ou déclenché par un lien externe).
   */
  @Post('daily-session/check')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async checkDailySession(@Request() req: { user: { id: string } }) {
    return this.dailySessionService.checkAndGenerateDailySession(req.user.id)
  }

  /**
   * Génère la proposition du coach quand le créneau du jour est occupé par une autre séance.
   * Renvoie la proposition déjà enregistrée sans rappeler l'IA.
   */
  @Post('daily-session/proposal')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generateProposal(@Request() req: { user: { id: string } }) {
    return this.dailySessionService.generateProposal(req.user.id)
  }
}
