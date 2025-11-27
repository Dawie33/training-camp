import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { CreateWorkoutDto, GenerateWorkoutDto, SaveBenchmarkResultDto, WorkoutDto, WorkoutQueryDto } from '../dto/workout.dto'
import { AIWorkoutGeneratorService } from '../services/ai-workout-generator.service'
import { WorkoutsService } from '../services/workouts.service'

@Controller('workouts')
export class WorkoutsController {
  constructor(
    private readonly service: WorkoutsService,
    private readonly aiGenerator: AIWorkoutGeneratorService,
  ) { }

  @Get()
  async findAll(@Query() query: WorkoutQueryDto) {
    return await this.service.findAll(query)
  }

  @Get('daily')
  @UseGuards(JwtAuthGuard)
  async getDailyWorkout(
    @Request() req: { user: { id: string } },
    @Query('date') date?: string,
  ) {
    const workout = await this.service.getDailyWorkout(req.user.id, date)
    if (!workout) {
      throw new NotFoundException('Aucun workout trouvé pour ce sport et cette date')
    }
    return workout
  }

  @Get('benchmark')
  @UseGuards(JwtAuthGuard)
  async getBenchmarkWorkouts(
    @Query('sportId') sportId?: string,
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
    const workout = await this.service.findOne(id)
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


  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createWorkoutDto: CreateWorkoutDto) {
    return await this.service.create(createWorkoutDto)
  }

  @Post('generate-ai')
  async generateWithAI(@Body() dto: GenerateWorkoutDto) {
    return this.aiGenerator.generateWorkout(dto)
  }

  @Post('benchmark-result')
  @UseGuards(JwtAuthGuard)
  async saveBenchmarkResult(
    @Request() req: { user: { id: string } },
    @Body() body: SaveBenchmarkResultDto
  ) {
    return await this.service.saveBenchmarkResult(req.user.id, body)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateWorkoutDto: CreateWorkoutDto) {
    return await this.service.update(id, updateWorkoutDto)
  }

  @Delete('personalized/:id')
  @UseGuards(JwtAuthGuard)
  async deletePersonalizedWorkout(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.service.deletePersonalizedWorkout(id, req.user.id)
    return { success: true, message: 'Workout personnalisé supprimé' }
  }

}


