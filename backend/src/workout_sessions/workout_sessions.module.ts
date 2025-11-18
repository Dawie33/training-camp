import { Module } from '@nestjs/common'
import { WorkoutSessionsController } from './workout_sessions.controller'
import { WorkoutSessionsService } from './workout_sessions.service'

@Module({
    controllers: [WorkoutSessionsController],
    providers: [WorkoutSessionsService],
    exports: [WorkoutSessionsService],
})
export class WorkoutSessionsModule { }
