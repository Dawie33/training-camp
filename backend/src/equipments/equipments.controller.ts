import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { EquipmentQueryDto } from './dto'
import { EquipmentsService } from './equipments.service'

/**
 * Catalogue d'équipements partagé par tous les utilisateurs : lecture seule.
 * Il est géré par les seeds et les migrations, jamais par l'API.
 */
@Controller('equipments')
export class EquipmentsController {
  constructor(private readonly service: EquipmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: EquipmentQueryDto) {
    return await this.service.findAll(query)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }
}
