import { Module } from '@nestjs/common'
import { AdminWorkoutController } from './controllers/admin.controller'
import { UserWorkoutController } from './controllers/user.controller'
import { AdminWorkoutService } from './services/admin-workout.service'
import { WorkoutService } from './services/workouts.service'
@Module({
  controllers: [AdminWorkoutController, UserWorkoutController],
  providers: [WorkoutService, AdminWorkoutService],
})
export class WorkoutsModule {}
