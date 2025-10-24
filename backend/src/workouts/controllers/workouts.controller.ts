import { Controller, Get, NotFoundException, Param, Query, Request, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { WorkoutQueryDto } from '../dto/workout.dto'
import { WorkoutsService } from '../services/workouts.service'

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly service: WorkoutsService) { }

  @Get()
  async findAll(@Query() query: WorkoutQueryDto) {
    return await this.service.findAll(query)
  }

  @Get('daily')
  async getDailyWorkout(
    @Query('sportId') sportId: string,
    @Query('date') date?: string
  ) {
    const workout = await this.service.getDailyWorkoutBySport(sportId, date)
    if (!workout) {
      throw new NotFoundException('Aucun workout trouvé pour ce sport et cette date')
    }
    return workout
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  async getRecommendedWorkouts(
    @Request() req: { user: { id: string } },
    @Query('sportId') sportId: string,
    @Query('limit') limit: number = 10
  ) {
    return await this.service.getRecommendedWorkouts(req.user.id, sportId, limit)
  }

  @Get('benchmark')
  @UseGuards(JwtAuthGuard)
  async getBenchmarkWorkouts(
    @Query('sportId') sportId: string,
  ) {
    return await this.service.getBenchmarkWorkouts(sportId)
  }


  @Get(':id')
  async getWorkoutById(@Param('id') id: string) {
    const workout = await this.service.getWorkoutById(id)
    if (!workout) {
      throw new NotFoundException('Workout non trouvé')
    }
    return workout
  }

}


