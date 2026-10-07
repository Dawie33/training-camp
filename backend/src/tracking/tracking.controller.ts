import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { TrackingService } from './tracking.service'
import { SportType } from './types/tracking.types'

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string }
}

const VALID_SPORTS: SportType[] = ['crossfit']

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('reports')
  async getAllReports(@Req() req: AuthenticatedRequest) {
    return this.trackingService.getLatestReports(req.user.id)
  }

  @Get('report/saved')
  async getSavedReport(@Req() req: AuthenticatedRequest, @Query('sport') sport?: string) {
    const userId = req.user.id
    const validSport: SportType = VALID_SPORTS.includes(sport as SportType) ? (sport as SportType) : 'crossfit'
    return this.trackingService.getSavedReport(userId, validSport)
  }

  @Post('report/check-monthly')
  async checkMonthlyReport(@Req() req: AuthenticatedRequest, @Query('sport') sport?: string) {
    const userId = req.user.id
    const validSport: SportType = VALID_SPORTS.includes(sport as SportType) ? (sport as SportType) : 'crossfit'
    return this.trackingService.checkAndGenerateMonthlyReport(userId, validSport)
  }

  @Post('report')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generateReport(
    @Req() req: AuthenticatedRequest,
    @Query('sport') sport?: string,
    @Query('months') months?: string
  ) {
    const userId = req.user.id
    const validSport: SportType = VALID_SPORTS.includes(sport as SportType) ? (sport as SportType) : 'crossfit'
    const validMonths = Math.min(Math.max(Number(months) || 3, 1), 12)
    return this.trackingService.generateReport(userId, validSport, validMonths)
  }
}
