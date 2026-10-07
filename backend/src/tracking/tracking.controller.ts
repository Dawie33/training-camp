import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { TrackingService } from './tracking.service'

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string }
}

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('reports')
  async getAllReports(@Req() req: AuthenticatedRequest) {
    return this.trackingService.getLatestReports(req.user.id)
  }

  @Get('report/saved')
  async getSavedReport(@Req() req: AuthenticatedRequest) {
    return this.trackingService.getSavedReport(req.user.id)
  }

  @Post('report/check-monthly')
  async checkMonthlyReport(@Req() req: AuthenticatedRequest) {
    return this.trackingService.checkAndGenerateMonthlyReport(req.user.id)
  }

  @Post('report')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generateReport(@Req() req: AuthenticatedRequest, @Query('months') months?: string) {
    const validMonths = Math.min(Math.max(Number(months) || 3, 1), 12)
    return this.trackingService.generateReport(req.user.id, validMonths)
  }
}
