import { Controller, Get, NotFoundException, Param, Query, Request, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { WorkoutQueryDto } from '../dto/workout.dto'
import { WorkoutsService } from '../services/workouts.service'

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly service: WorkoutsService) { }

  /**
   * Retrieves all workouts.
   * @returns All workouts
   */
  @Get()
  async findAll(@Query() query: WorkoutQueryDto) {
    return await this.service.findAll(query)
  }

  /**
   * Récupère le workout du jour pour un sport donné
   * @param sportId ID du sport
   * @param date Date du workout (optionnel, par défaut aujourd'hui)
   * @returns Le workout du jour pour ce sport
   */
  @Get('daily/:sportId')
  async getDailyWorkout(
    @Param('sportId') sportId: string,
    @Query('date') date?: string
  ) {
    const workout = await this.service.getDailyWorkoutBySport(sportId, date)
    if (!workout) {
      throw new NotFoundException('Aucun workout trouvé pour ce sport et cette date')
    }
    return workout
  }

  /**
   * Récupère les workouts recommandés pour l'utilisateur actuel
   * Basé sur son sport actif, son niveau et ses équipements
   * @param req Objet de requête avec user authentifié
   * @param sportId ID du sport actif
   * @param limit Nombre de workouts à retourner (défaut: 4)
   * @returns Liste paginée de workouts recommandés
   */
  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  async getRecommendedWorkouts(
    @Request() req: { user: { id: string } },
    @Query('sportId') sportId: string,
    @Query('limit') limit: number = 10
  ) {
    return await this.service.getRecommendedWorkouts(req.user.id, sportId, limit)
  }

  /**
   * Récupère un workout par son ID
   * @param id ID du workout
   * @returns Le workout
   */
  @Get(':id')
  async getWorkoutById(@Param('id') id: string) {
    const workout = await this.service.getWorkoutById(id)
    if (!workout) {
      throw new NotFoundException('Workout non trouvé')
    }
    return workout
  }

}


