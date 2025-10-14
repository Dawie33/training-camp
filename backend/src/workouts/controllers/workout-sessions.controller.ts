import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { CreateWorkoutSessionDto, UpdateWorkoutSessionDto } from '../dto/session.dto'
import { WorkoutSessionsService } from '../services/workout-sessions.service'

interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
  }
}

@Controller('workout-sessions')
@UseGuards(JwtAuthGuard)
export class WorkoutSessionsController {
  constructor(private readonly sessionsService: WorkoutSessionsService) { }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id
    return this.sessionsService.findAll(userId)
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') sessionId: string) {
    const userId = req.user.id
    const session = await this.sessionsService.findOne(sessionId, userId)

    if (!session) {
      throw new NotFoundException('Session non trouvée')
    }

    return session
  }

  @Get('workout/:workoutId')
  async findByWorkout(@Req() req: AuthenticatedRequest, @Param('workoutId') workoutId: string) {
    const userId = req.user.id
    return this.sessionsService.findByWorkout(workoutId, userId)
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() data: CreateWorkoutSessionDto) {
    const userId = req.user.id
    return this.sessionsService.create(userId, data)
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') sessionId: string,
    @Body() data: UpdateWorkoutSessionDto
  ) {
    const userId = req.user.id
    const session = await this.sessionsService.update(sessionId, userId, data)

    if (!session) {
      throw new NotFoundException('Session non trouvée ou non autorisée')
    }

    return session
  }




}
