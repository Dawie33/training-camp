import { Module } from '@nestjs/common'
import { WorkoutSessionsController } from './controllers/workout-sessions.controller'
import { WorkoutsController } from './controllers/workouts.controller'
import { WorkoutSessionsService } from './services/workout-sessions.service'
import { WorkoutsService } from './services/workouts.service'

@Module({
  controllers: [WorkoutsController, WorkoutSessionsController],
  providers: [WorkoutsService, WorkoutSessionsService],
  exports: [WorkoutsService, WorkoutSessionsService],
})
export class WorkoutsModule { }
