import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common'
import { QueryDto } from 'src/workouts/dto/workout.dto'
import { AdminWorkoutService } from '../services/admin-workouts.service'

@Controller('admin/workouts')
export class AdminWorkoutsController {
  constructor(private readonly service: AdminWorkoutService) { }

  @Get()
  async findAll(@Query() query: QueryDto
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

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id)
  }
}
