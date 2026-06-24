import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { BikingSessionQueryDto, CreateBikingSessionDto, GenerateBikingSessionDto, UpdateBikingSessionDto } from './dto/biking.dto'
import { BikingService } from './services/biking.service'


@Controller('biking')
@UseGuards(JwtAuthGuard)
export class BikingController {
    constructor(private readonly bikingService: BikingService) { }

    // ── Sessions ────────────────────────────────────────────────────────────────

    @Get('sessions')
    async findAll(@Req() req, @Query() query: BikingSessionQueryDto) {
        return this.bikingService.findAll(req.user.id, query)
    }

    @Get('sessions/stats')
    async getStats(@Req() req) {
        return this.bikingService.getStats(req.user.id)
    }

    @Get('sessions/:id')
    async findOne(@Req() req, @Param('id') id: string) {
        return this.bikingService.findOne(id, req.user.id)
    }

    @Post('sessions')
    async create(@Req() req, @Body() data: CreateBikingSessionDto) {
        return this.bikingService.create(req.user.id, data)
    }

    @Patch('sessions/:id')
    async update(@Req() req, @Param('id') id: string, @Body() data: UpdateBikingSessionDto) {
        return this.bikingService.update(id, req.user.id, data)
    }

    @Delete('sessions/:id')
    async delete(@Req() req, @Param('id') id: string) {
        return this.bikingService.delete(id, req.user.id)
    }

    // ── Génération IA ────────────────────────────────────────────────────────────

    @Post('generate/preview')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async generatePreview(@Req() req, @Body() data: GenerateBikingSessionDto) {
        return this.bikingService.generatePreview(req.user.id, data)
    }

    @Post('generate/save')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async generateAndSave(@Req() req, @Body() data: GenerateBikingSessionDto) {
        return this.bikingService.generateAndSave(req.user.id, data)
    }
}