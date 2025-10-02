import { Controller, Get, Query } from "@nestjs/common"
import { QueryDto } from "src/workouts/dto/workout.dto"
import { EquipmentsService } from "./equipments.service"


@Controller('equipments')
export class EquipmentsController {
    constructor(
        private readonly service: EquipmentsService
    ) { }

    @Get()
    async findAll(@Query() query: QueryDto) {
        return this.service.findAll(query)
    }
}