import { Module } from '@nestjs/common'
import { ProgressionAnalysisService } from './progression-analysis.service'
import { WorkoutAnalysisService } from './workout-analysis.service'
import { WorkoutSessionsController } from './workout-sessions.controller'
import { WorkoutSessionsService } from './workout-sessions.service'

@Module({
    controllers: [WorkoutSessionsController],
    providers: [WorkoutSessionsService, WorkoutAnalysisService, ProgressionAnalysisService],
    exports: [WorkoutSessionsService],
})
export class WorkoutSessionsModule { }
