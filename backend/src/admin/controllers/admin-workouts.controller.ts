import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { CreateWorkoutDto, UpdateWorkoutDto, WorkoutQueryDto } from 'src/workouts/dto'
import { GenerateWorkoutDto } from 'src/workouts/dto/generate-workout.dto'
import { AIWorkoutGeneratorService } from 'src/workouts/services/ai-workout-generator.service'
import { AdminWorkoutService } from '../services/admin-workouts.service'

@Controller('admin/workouts')
export class AdminWorkoutsController {
  constructor(
    private readonly service: AdminWorkoutService,
    private readonly aiGenerator: AIWorkoutGeneratorService
  ) { }

  @Get()
  async findAll(@Query() query: WorkoutQueryDto
  ) {
    return this.service.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Get(':id/exercises')
  async getWorkoutExercises(@Param('id') id: string) {
    return this.service.getWorkoutExercises(id)
  }

  @Post()
  async create(@Body() data: CreateWorkoutDto) {
    return this.service.create(data)
  }

  @Post('generate-ai')
  async generateWithAI(@Body() dto: GenerateWorkoutDto) {
    return this.aiGenerator.generateWorkout(dto)
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateWorkoutDto) {
    return this.service.update(id, data)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id)
  }
}
