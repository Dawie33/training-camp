import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { CreateEquipmentDto, EquipmentQueryDto, UpdateEquipmentDto } from 'src/equipments/dto'
import { AdminEquipmentsService } from '../services/admin-equipments.service'

@Controller('admin/equipments')
export class AdminEquipmentsController {
  constructor(private readonly service: AdminEquipmentsService) { }

  @Get()
  async findAll(@Query() query: EquipmentQueryDto) {
    return await this.service.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post()
  async create(@Body() data: CreateEquipmentDto) {
    return this.service.create(data)
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateEquipmentDto) {
    return this.service.update(id, data)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id)
  }

}
