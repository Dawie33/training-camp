import { Module } from '@nestjs/common'
import { WorkoutsModule } from '../workouts/workouts.module'
import { BikingController } from './biking.controller'
import { AIBikingGeneratorService } from './services/ai-biking-generator.service'
import { BikingService } from './services/biking.service'

@Module({
    imports: [WorkoutsModule],
    controllers: [BikingController],
    providers: [BikingService, AIBikingGeneratorService],
    exports: [BikingService],
})
export class BikingModule { }