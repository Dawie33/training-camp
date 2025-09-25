import { Module } from '@nestjs/common'
import { WorkoutAiService } from './workout-ai.service'
import { WorkoutController } from './workouts.controller'
import { WorkoutService } from './workouts.service'
@Module({
  controllers: [WorkoutController],
  providers: [WorkoutService, WorkoutAiService],
  exports: [WorkoutService, WorkoutAiService],
})
export class WorkoutsModule {}
