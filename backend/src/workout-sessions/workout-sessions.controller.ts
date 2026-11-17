import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../common/types/authenticated-user'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateWorkoutSessionDto, UpdateWorkoutSessionDto } from './dto/session.dto'
import { WorkoutAnalysisService } from './workout-analysis.service'
import { WorkoutSessionsService } from './workout-sessions.service'

@Controller('workout-sessions')
@UseGuards(JwtAuthGuard)
export class WorkoutSessionsController {
  constructor(
    private readonly sessionsService: WorkoutSessionsService,
    private readonly analysisService: WorkoutAnalysisService
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const userId = user.id
    return this.sessionsService.findAll(userId, limit, offset)
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') sessionId: string) {
    const userId = user.id
    const session = await this.sessionsService.findOne(sessionId, userId)

    if (!session) {
      throw new NotFoundException('Session non trouvée')
    }

    return session
  }

  @Get('workout/:workoutId')
  async findByWorkout(@CurrentUser() user: AuthenticatedUser, @Param('workoutId') workoutId: string) {
    const userId = user.id
    return this.sessionsService.findByWorkout(workoutId, userId)
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateWorkoutSessionDto) {
    const userId = user.id
    return this.sessionsService.create(userId, data)
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') sessionId: string,
    @Body() data: UpdateWorkoutSessionDto
  ) {
    const userId = user.id
    const session = await this.sessionsService.update(sessionId, userId, data)

    if (!session) {
      throw new NotFoundException('Session non trouvée ou non autorisée')
    }

    return session
  }

  @Post(':id/analyze')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async analyze(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') sessionId: string,
    @Query('force') force?: string
  ) {
    const userId = user.id
    return this.analysisService.analyzeSession(sessionId, userId, force === 'true')
  }

  @Delete(':id')
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') sessionId: string) {
    const userId = user.id
    const deleted = await this.sessionsService.delete(sessionId, userId)

    if (!deleted) {
      throw new NotFoundException('Session non trouvée ou non autorisée')
    }

    return { success: true, message: 'Session supprimée' }
  }
}
