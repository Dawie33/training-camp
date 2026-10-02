import { Controller, Get, Headers, Ip, Logger } from '@nestjs/common'
import { HealthResponseDTO, InfoResponseDTO } from './dto/healthcheck.dto'
import { HealthcheckService } from './healthcheck.service'

@Controller()
export class HealthcheckController {
  private readonly logger = new Logger(HealthcheckController.name);

  constructor(private readonly healthcheckService: HealthcheckService) {}

  @Get('/health')
  async health(
    @Ip() request_ip: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('x-origin-secret') originSecret?: string,
  ): Promise<HealthResponseDTO> {
    this.logger.debug(`GET /health - received from client: ${request_ip}`);
    // TEMPORAIRE : réglage de TRUST_PROXY et vérification du verrou d'origine. À retirer une fois réglé.
    // Ne logue que la présence du secret, jamais sa valeur.
    if (forwardedFor) {
      this.logger.log(
        `[trust-proxy-debug] req.ip=${request_ip} x-forwarded-for="${forwardedFor}" origin-secret=${originSecret ? 'présent' : 'absent'}`,
      );
    }
    return { status: 'OK' };
  }

  @Get('/info')
  async getInfo(@Ip() request_ip: string): Promise<InfoResponseDTO> {
    this.logger.debug(`GET /info - received from client: {${request_ip}}`);
    return this.healthcheckService.readProjectDetails();
  }
}