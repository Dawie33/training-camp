import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../common/types/authenticated-user'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { OneRepMaxLiftParamDto, UpsertOneRepMaxDto } from './dto/one-rep-max.dto'
import { OneRepMaxesService } from './one-rep-maxes.service'

@Controller('one-rep-maxes')
@UseGuards(JwtAuthGuard)
export class OneRepMaxesController {
  constructor(private readonly service: OneRepMaxesService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAllByUser(user.id)
  }

  @Get('history')
  async findHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findHistoryByUser(user.id)
  }

  @Put(':lift')
  async upsert(
    @Param() { lift }: OneRepMaxLiftParamDto,
    @Body() dto: UpsertOneRepMaxDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.service.upsert(user.id, lift, dto.value, dto.source, dto.measured_at)
  }

  @Delete('history/:id')
  @HttpCode(204)
  async deleteHistory(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.service.deleteHistory(user.id, id)
  }
}
