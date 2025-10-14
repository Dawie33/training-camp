import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { CreateExerciseDto, ExerciseQueryDto, UpdateExerciseDto } from 'src/exercises/dto/exercises.dto'
import { AdminExercicesService } from '../services/admin-exercises.service'

@Controller('admin/exercises')
export class AdminExercisesController {
  constructor(private service: AdminExercicesService) { }

  @Get()
  async findAll(@Query() query: ExerciseQueryDto) {
    return await this.service.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post()
  async create(@Body() data: CreateExerciseDto) {
    return this.service.create(data)
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateExerciseDto) {
    return this.service.update(id, data)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id)
  }


}
