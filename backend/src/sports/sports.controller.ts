import { Controller, Get, Param, Query } from "@nestjs/common"
import { QueryDto } from "../workouts/dto/workout.dto"
import { SportsService } from "./sports.service"

@Controller('sports')
export class SportsController {
  constructor(
    private readonly service: SportsService
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