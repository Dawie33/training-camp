import { Body, Controller, Get, Patch, Request, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard"
import { UpdateUserDto } from "./dto"
import { UsersService } from "./users.service"

@Controller('users')
export class UsersController {
    constructor(private readonly service: UsersService) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(
        @Request() req: { user: { id: string } },
    ) {
        return await this.service.getProfile(req.user.id)
    }

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    async updateMe(@Body() data: UpdateUserDto, @Request() req: { user: { id: string } }) {
        return this.service.update(req.user.id, data)
    }
}
