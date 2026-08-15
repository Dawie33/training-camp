import { Module } from '@nestjs/common'
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module'
import { WorkoutScheduleController } from './controllers/workout-schedule.controller'
import { WorkoutsController } from './controllers/workouts.controller'
import { AIWorkoutGeneratorService } from './services/ai-workout-generator.service'
import { UserContextService } from './services/user-context.service'
import { WorkoutScheduleService } from './services/workout-schedule.service'
import { WorkoutsService } from './services/workouts.service'

@Module({
  imports: [GoogleCalendarModule],
  controllers: [WorkoutsController, WorkoutScheduleController],
  providers: [WorkoutsService, AIWorkoutGeneratorService, WorkoutScheduleService, UserContextService],
  exports: [WorkoutsService, WorkoutScheduleService, UserContextService],
})
export class WorkoutsModule { }
