import { Module } from '@nestjs/common'
import { WorkoutSessionsController } from './controllers/workout-sessions.controller'
import { WorkoutController } from './controllers/workout.controller'
import { WorkoutSessionsService } from './services/workout-sessions.service'
import { WorkoutService } from './services/workouts.service'

@Module({
  controllers: [WorkoutController, WorkoutSessionsController],
  providers: [WorkoutService, WorkoutSessionsService],
  exports: [WorkoutService, WorkoutSessionsService],
})
export class WorkoutsModule { }
