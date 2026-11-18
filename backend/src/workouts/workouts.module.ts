import { Module } from '@nestjs/common'
import { UserContextModule } from '../user-context/user-context.module'
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module'
import { WorkoutScheduleController } from './controllers/workout-schedule.controller'
import { WorkoutsController } from './controllers/workouts.controller'
import { AIWorkoutGeneratorService } from './services/ai-workout-generator.service'
import { WorkoutScheduleService } from './services/workout-schedule.service'
import { WorkoutsService } from './services/workouts.service'

/**
 * Module workouts : CRUD des workouts et de leur planification, génération assistée
 * par IA (WODs).
 */
@Module({
  imports: [GoogleCalendarModule, UserContextModule],
  controllers: [WorkoutsController, WorkoutScheduleController],
  providers: [WorkoutsService, AIWorkoutGeneratorService, WorkoutScheduleService],
  exports: [WorkoutsService, WorkoutScheduleService, AIWorkoutGeneratorService],
})
export class WorkoutsModule {}
