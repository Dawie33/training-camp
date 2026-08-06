import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { GenerateMobilitySessionDto } from './dto/mobility.dto'
import { MobilityService } from './services/mobility.service'

@Controller('mobility')
@UseGuards(JwtAuthGuard)
export class MobilityController {
    constructor(private readonly mobilityService: MobilityService) { }

    @Post('generate')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async generate(@Req() req, @Body() data: GenerateMobilitySessionDto) {
        return this.mobilityService.generate(req.user.id, data)
    }
}
