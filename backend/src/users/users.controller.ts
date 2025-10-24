import { Body, Controller, Get, Post, Query, Request, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard"
import { SaveBenchmarkResultDto } from "./dto"
import { UsersService } from "./users.service"

@Controller('users')
export class UsersController {
    constructor(private readonly service: UsersService) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(
        @Request() req: { user: { id: string } },
        @Query('sportId') sportId?: string,
    ) {
        return await this.service.getProfile(req.user.id, sportId)
    }

    @Post('benchmark-result')
    @UseGuards(JwtAuthGuard)
    async saveBenchmarkResult(
        @Request() req: { user: { id: string } },
        @Body() body: SaveBenchmarkResultDto
    ) {
        return await this.service.saveBenchmarkResult(
            req.user.id,
            body
        )
    }
} 
