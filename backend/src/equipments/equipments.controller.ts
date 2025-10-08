import { Controller, Get, Query } from "@nestjs/common"
import { EquipmentQueryDto } from "./dto"
import { EquipmentsService } from "./equipments.service"


@Controller('equipments')
export class EquipmentsController {
    constructor(
        private readonly service: EquipmentsService
    ) { }

    @Get()
    async findAll(@Query() query: EquipmentQueryDto) {
        return this.service.findAll(query)
    }
}