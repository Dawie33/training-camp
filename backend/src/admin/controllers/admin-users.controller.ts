import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common'
import { AdminUsersService } from '../services/admin-users.service'
import { UsersQueryDto } from '../users.dto'

@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) { }

  @Get()
  async findAll(@Query() query: UsersQueryDto) {
    return this.service.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id)
  }

  @Get(':id/workouts')
  async getUserWorkouts(@Param('id') id: string) {
    return this.service.getUserWorkouts(id)
  }

  @Get(':id/sessions')
  async getUserSessions(@Param('id') id: string) {
    return this.service.getUserSessions(id)
  }
}
