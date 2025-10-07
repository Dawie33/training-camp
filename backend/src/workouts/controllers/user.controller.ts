import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'
import { QueryDto } from '../dto/workout.dto'
import { WorkoutService } from '../services/workouts.service'

@Controller('workouts')
export class UserWorkoutController {
  constructor(private readonly service: WorkoutService) { }

  /**
   * Retrieves all workouts.
   * @returns All workouts
   */
  @Get()
  async findAll(@Query() query: QueryDto) {
    return await this.service.findAll(query)
  }

  /**
   * Récupère le workout du jour pour un sport donné
   * @param sportId ID du sport
   * @param date Date du workout (optionnel, par défaut aujourd'hui)
   * @returns Le workout du jour pour ce sport
   */
  @Get('daily/sports/:sportId')
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
   * Récupère un workout par son ID
   * @param id ID du workout
   * @returns Le workout
   */
  @Get('daily/:id')
  async getWorkoutById(@Param('id') id: string) {
    const workout = await this.service.getWorkoutById(id)
    if (!workout) {
      throw new NotFoundException('Workout non trouvé')
    }
    return workout
  }

}


