import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard"
import { ExerciseQueryDto } from "./dto/exercises.dto"
import { ExercisesService } from "./exercises.service"

/**
 * Référentiel d'exercices partagé par tous les utilisateurs : lecture seule.
 * Une suppression partirait en cascade sur workout_exercises (les workouts de tous les utilisateurs).
 */
@Controller('exercises')
export class ExercisesController {
    constructor(
        private readonly service: ExercisesService
    ) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query() query: ExerciseQueryDto) {
        return await this.service.findAll(query)
    }

    @Get('by-name/:name')
    @UseGuards(JwtAuthGuard)
    async findByName(@Param('name') name: string) {
        return this.service.findByName(name)
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        return this.service.findOne(id)
    }
}
