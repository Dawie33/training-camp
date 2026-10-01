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
  ): Promise<HealthResponseDTO> {
    this.logger.debug(`GET /health - received from client: ${request_ip}`);
    // TEMPORAIRE : mesure de la chaîne de proxys pour régler TRUST_PROXY. À retirer une fois réglé.
    if (forwardedFor) {
      this.logger.log(`[trust-proxy-debug] req.ip=${request_ip} x-forwarded-for="${forwardedFor}"`);
    }
    return { status: 'OK' };
  }

  @Get('/info')
  async getInfo(@Ip() request_ip: string): Promise<InfoResponseDTO> {
    this.logger.debug(`GET /info - received from client: {${request_ip}}`);
    return this.healthcheckService.readProjectDetails();
  }
}