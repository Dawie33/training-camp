import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { QueryDto } from 'src/workouts/dto/workout.dto'
import { AdminEquipmentsService } from '../services/admin-equipments.service'

@Controller('admin/equipments')
export class AdminEquipmentsController {
  constructor(private readonly service: AdminEquipmentsService) { }

  @Get()
  async findAll(@Query() query: QueryDto) {
    return await this.service.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post()
  async create(@Body() data: any) {
    return this.service.create(data)
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
