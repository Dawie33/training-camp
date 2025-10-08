import { Module } from '@nestjs/common'
import { UserWorkoutController } from './controllers/user.controller'
import { WorkoutSessionsController } from './controllers/workout-sessions.controller'
import { WorkoutService } from './services/workouts.service'
import { WorkoutSessionsService } from './services/workout-sessions.service'

@Module({
  controllers: [UserWorkoutController, WorkoutSessionsController],
  providers: [WorkoutService, WorkoutSessionsService],
  exports: [WorkoutService, WorkoutSessionsService],
})
export class WorkoutsModule {}
