import { Body, Controller, Get, NotFoundException, Param, Post, Query, Request, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { WorkoutDto, WorkoutQueryDto } from '../dto/workout.dto'
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

  @Get('personalized')
  @UseGuards(JwtAuthGuard)
  async getPersonalizedWorkouts(
    @Request() req: { user: { id: string } },
    @Query() query: WorkoutQueryDto & {
      limit?: string
      offset?: string
      search?: string
      difficulty?: string
      intensity?: string
      minDuration?: string
      maxDuration?: string
    }
  ) {
    return await this.service.getPersonalizedWorkouts(
      req.user.id,
      query.limit,
      query.offset,
      query.search,
      query.difficulty,
      query.intensity,
      query.minDuration,
      query.maxDuration
    )
  }

  @Get('personalized/:id')
  @UseGuards(JwtAuthGuard)
  async getPersonalizedWorkout(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return await this.service.getPersonalizedWorkout(id, req.user.id)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getWorkoutById(@Param('id') id: string) {
    const workout = await this.service.getWorkoutById(id)
    if (!workout) {
      throw new NotFoundException('Workout non trouvé')
    }
    return workout
  }

  @Post('personalized')
  @UseGuards(JwtAuthGuard)
  async createPersonalizedWorkouts(
    @Body() data: WorkoutDto,
    @Request() req: { user: { id: string } },
  ) {
    const response = await this.service.createPersonalizedWorkout(data, req.user.id)
    return response
  }




}


