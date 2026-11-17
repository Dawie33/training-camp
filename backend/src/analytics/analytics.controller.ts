import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../common/types/authenticated-user'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AnalyticsService } from './analytics.service'
import { OverviewQueryDto } from './dto/overview-query.dto'

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
  async getOverview(@CurrentUser() user: AuthenticatedUser, @Query() query: OverviewQueryDto) {
    return this.analyticsService.getOverview(user.id, query.months)
  }
}
