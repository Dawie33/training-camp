import { Module } from '@nestjs/common'
import { UserContextModule } from 'src/user-context/user-context.module'
import { WorkoutsModule } from 'src/workouts/workouts.module'
import { WorkoutAnalysisService } from './workout-analysis.service'
import { WorkoutSessionsController } from './workout-sessions.controller'
import { WorkoutSessionsService } from './workout-sessions.service'

@Module({
  imports: [UserContextModule, WorkoutsModule],
  controllers: [WorkoutSessionsController],
  providers: [WorkoutSessionsService, WorkoutAnalysisService],
  exports: [WorkoutSessionsService],
})
export class WorkoutSessionsModule {}
