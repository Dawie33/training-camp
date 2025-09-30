import { Controller, Get, Query } from "@nestjs/common"
import { QueryDto } from "src/workouts/dto.ts/dto"
import { SportsService } from "./sports.service"

@Controller('sports')
export class SportsController {
 constructor(
   private readonly service: SportsService
 ) {}

    @Get()
    async findAll(@Query() query : QueryDto) {
        return await this.service.findAll(query);
    }
}