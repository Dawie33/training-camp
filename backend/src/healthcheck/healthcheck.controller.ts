import { Controller, Get } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { HealthResponseDTO } from './dto/healthcheck.dto'

/**
 * Sondé régulièrement par Render pour savoir si l'instance est vivante.
 * Public (exempté du verrou d'origine), sans quota de requêtes et sans log.
 */
@Controller()
export class HealthcheckController {
  @Get('/health')
  @SkipThrottle()
  health(): HealthResponseDTO {
    return { status: 'OK' }
  }
}
