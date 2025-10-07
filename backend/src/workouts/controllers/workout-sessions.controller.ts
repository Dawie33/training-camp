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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { CreateWorkoutSessionDto, UpdateWorkoutSessionDto } from '../dto/session.dto'
import { WorkoutSessionsService } from '../services/workout-sessions.service'

@Controller('workout-sessions')
@UseGuards(JwtAuthGuard)
export class WorkoutSessionsController {
  constructor(private readonly sessionsService: WorkoutSessionsService) { }

  /**
   * Crée une nouvelle session de workout
   * @param req Request avec user authentifié
   * @param data Données de création
   * @returns La session créée
   */
  @Post()
  async create(@Req() req: any, @Body() data: CreateWorkoutSessionDto) {
    console.log('🎯 Creating workout session:', { userId: req.user.id, data })
    const userId = req.user.id
    return this.sessionsService.create(userId, data)
  }

  /**
   * Met à jour une session de workout
   * @param req Request avec user authentifié
   * @param sessionId ID de la session
   * @param data Données de mise à jour
   * @returns La session mise à jour
   */
  @Patch(':id')
  async update(
    @Req() req: any,
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

  /**
   * Récupère une session par son ID
   * @param req Request avec user authentifié
   * @param sessionId ID de la session
   * @returns La session
   */
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') sessionId: string) {
    const userId = req.user.id
    const session = await this.sessionsService.findOne(sessionId, userId)

    if (!session) {
      throw new NotFoundException('Session non trouvée')
    }

    return session
  }

  /**
   * Récupère toutes les sessions de l'utilisateur connecté
   * @param req Request avec user authentifié
   * @returns Liste des sessions
   */
  @Get()
  async findByUser(@Req() req: any) {
    const userId = req.user.id
    return this.sessionsService.findByUser(userId)
  }

  /**
   * Récupère les sessions d'un workout spécifique
   * @param req Request avec user authentifié
   * @param workoutId ID du workout
   * @returns Liste des sessions
   */
  @Get('workout/:workoutId')
  async findByWorkout(@Req() req: any, @Param('workoutId') workoutId: string) {
    const userId = req.user.id
    return this.sessionsService.findByWorkout(workoutId, userId)
  }
}
