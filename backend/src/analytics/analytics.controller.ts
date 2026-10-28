import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AnalyticsService } from './analytics.service'
import { OverviewQueryDto } from './dto/overview-query.dto'

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
   * @param query `months` : profondeur d'analyse, entière entre 1 et 12 mois (3 par défaut), sinon 400
   */
  @Get('overview')
  async getOverview(@Req() req: AuthenticatedRequest, @Query() query: OverviewQueryDto) {
    return this.analyticsService.getOverview(req.user.id, query.months)
  }
}
