import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { SportType, TrackingService } from './tracking.service'

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string }
}

const VALID_SPORTS: SportType[] = ['crossfit', 'running', 'hyrox', 'athx', 'global']

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('report')
  async getReport(
    @Req() req: AuthenticatedRequest,
    @Query('sport') sport?: string,
    @Query('months') months?: string,
  ) {
    const userId = req.user.id
    const validSport: SportType = VALID_SPORTS.includes(sport as SportType) ? (sport as SportType) : 'crossfit'
    const validMonths = Math.min(Math.max(Number(months) || 3, 1), 12)
    return this.trackingService.generateReport(userId, validSport, validMonths)
  }
}
