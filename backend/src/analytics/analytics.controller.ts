import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AnalyticsService } from './analytics.service'

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string }
}

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Diagnostic de performance calculé — ratios de force, benchmarks, filières,
   * volume, charge et exposition par mouvement. Aucun appel à l'IA.
   * @param months Profondeur d'analyse, bornée entre 1 et 12 mois
   */
  @Get('overview')
  async getOverview(@Req() req: AuthenticatedRequest, @Query('months') months?: string) {
    const validMonths = Math.min(Math.max(Number(months) || 3, 1), 12)
    return this.analyticsService.getOverview(req.user.id, validMonths)
  }
}
