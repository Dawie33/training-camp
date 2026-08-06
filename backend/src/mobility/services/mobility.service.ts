import { Injectable } from '@nestjs/common'
import { GenerateMobilitySessionDto } from '../dto/mobility.dto'
import { GeneratedMobilityPlanValidated } from '../schemas/mobility.schema'
import { AIMobilityGeneratorService } from './ai-mobility-generator.service'

@Injectable()
export class MobilityService {
    constructor(private readonly aiGenerator: AIMobilityGeneratorService) { }

    async generate(userId: string, params: GenerateMobilitySessionDto): Promise<GeneratedMobilityPlanValidated> {
        return this.aiGenerator.generateMobilitySession(userId, params)
    }
}
