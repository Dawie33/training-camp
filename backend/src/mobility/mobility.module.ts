import { Module } from '@nestjs/common'
import { WorkoutsModule } from '../workouts/workouts.module'
import { MobilityController } from './mobility.controller'
import { AIMobilityGeneratorService } from './services/ai-mobility-generator.service'
import { MobilityService } from './services/mobility.service'

@Module({
    imports: [WorkoutsModule],
    controllers: [MobilityController],
    providers: [MobilityService, AIMobilityGeneratorService],
    exports: [MobilityService],
})
export class MobilityModule { }
