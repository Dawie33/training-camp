import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../common/types/authenticated-user'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { UpdateUserDto } from './dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return await this.service.getProfile(user.id)
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Body() data: UpdateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.update(user.id, data)
  }
}
