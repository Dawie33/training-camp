import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { CreateWorkoutDto, WorkoutQueryDto } from 'src/workouts/dto'
import { WorkoutBlocks } from 'src/workouts/types/workout.types'
import { AdminWorkoutService } from '../services/admin-workouts.service'

@Controller('admin/workouts')
export class AdminWorkoutsController {
  constructor(private readonly service: AdminWorkoutService) { }

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

  @Post('generate')
  async generate(
    @Body()
    body: {
      date: string
      sport: { id: string; slug: string }
      seed?: Partial<WorkoutBlocks>
      tags?: string[]
    },
  ) {
    const { date, sport, seed, tags = [] } = body
    return this.service.generate(date, sport, seed, tags)
  }


  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id)
  }
}
