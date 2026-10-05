import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common'
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
  // ParseUUIDPipe : un slug ou un texte quelconque donne un 400 clair, au lieu d'une erreur 500 de PostgreSQL
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id)
  }
}
