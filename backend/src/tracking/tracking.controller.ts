import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../common/types/authenticated-user'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { TrackingService } from './tracking.service'

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('reports')
  async getAllReports(@CurrentUser() user: AuthenticatedUser) {
    return this.trackingService.getLatestReports(user.id)
  }

  @Get('report/saved')
  async getSavedReport(@CurrentUser() user: AuthenticatedUser) {
    return this.trackingService.getSavedReport(user.id)
  }

  @Post('report/check-monthly')
  async checkMonthlyReport(@CurrentUser() user: AuthenticatedUser) {
    return this.trackingService.checkAndGenerateMonthlyReport(user.id)
  }

  @Post('report')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generateReport(@CurrentUser() user: AuthenticatedUser, @Query('months') months?: string) {
    const validMonths = Math.min(Math.max(Number(months) || 3, 1), 12)
    return this.trackingService.generateReport(user.id, validMonths)
  }
}
