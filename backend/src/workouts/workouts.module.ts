import { Module } from '@nestjs/common'
import { AdminWorkoutController } from './controllers/admin.controller'
import { UserWorkoutController } from './controllers/user.controller'
import { WorkoutSessionsController } from './controllers/workout-sessions.controller'
import { AdminWorkoutService } from './services/admin-workout.service'
import { WorkoutService } from './services/workouts.service'
import { WorkoutSessionsService } from './services/workout-sessions.service'

@Module({
  controllers: [AdminWorkoutController, UserWorkoutController, WorkoutSessionsController],
  providers: [WorkoutService, AdminWorkoutService, WorkoutSessionsService],
})
export class WorkoutsModule {}
