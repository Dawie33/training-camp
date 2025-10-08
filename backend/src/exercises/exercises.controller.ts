import { Controller, Get, Param, Query } from "@nestjs/common"
import { ExercisesService } from "./exercises.service"
import { QueryDto } from "src/workouts/dto/workout.dto"

@Controller('exercises')
export class ExercisesController {
    constructor(
        private readonly service: ExercisesService
    ) { }

    @Get()
    async findAll(@Query() query: QueryDto) {
        return await this.service.findAll(query)
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        return await this.service.getById(id)
    }

}