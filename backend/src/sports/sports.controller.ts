import { Controller, Get, Param, Query } from "@nestjs/common"
import { SportsQueryDto } from "./dto/sports.dto"
import { SportsService } from "./sports.service"

@Controller('sports')
export class SportsController {
  constructor(
    private readonly service: SportsService
  ) { }

  @Get()
  async findAll(@Query() query: SportsQueryDto) {
    return await this.service.findAll(query)
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.service.getById(id)
  }
}