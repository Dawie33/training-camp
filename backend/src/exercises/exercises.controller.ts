import { Controller, Get, Param, Query } from "@nestjs/common"
import { ExerciseQueryDto } from "./dto/exercises.dto"
import { ExercisesService } from "./exercises.service"

@Controller('exercises')
export class ExercisesController {
    constructor(
        private readonly service: ExercisesService
    ) { }

    @Get()
    async findAll(@Query() query: ExerciseQueryDto) {
        return await this.service.findAll(query)
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        return await this.service.getById(id)
    }

}