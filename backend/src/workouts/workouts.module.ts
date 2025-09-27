import { Module } from '@nestjs/common'
import { AdminWorkoutController } from './controllers/admin.controller'
import { UserWorkoutController } from './controllers/user.controller'
import { WorkoutAiService } from './services/workout-ai.service'
import { WorkoutService } from './services/workouts.service'
@Module({
  controllers: [AdminWorkoutController, UserWorkoutController],
  providers: [WorkoutService, WorkoutAiService],
})
export class WorkoutsModule {}
