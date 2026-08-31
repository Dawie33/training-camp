import { Module } from '@nestjs/common'
import { ExercisesModule } from '../exercises/exercises.module'
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module'
import { WorkoutScheduleController } from './controllers/workout-schedule.controller'
import { WorkoutsController } from './controllers/workouts.controller'
import { AICrossfitProgramGeneratorService } from './services/ai-crossfit-program-generator.service'
import { AIWorkoutGeneratorService } from './services/ai-workout-generator.service'
import { UserContextService } from './services/user-context.service'
import { WorkoutScheduleService } from './services/workout-schedule.service'
import { WorkoutsService } from './services/workouts.service'

@Module({
  imports: [GoogleCalendarModule, ExercisesModule],
  controllers: [WorkoutsController, WorkoutScheduleController],
  providers: [
    WorkoutsService,
    AIWorkoutGeneratorService,
    AICrossfitProgramGeneratorService,
    WorkoutScheduleService,
    UserContextService,
  ],
  exports: [WorkoutsService, WorkoutScheduleService, UserContextService, AICrossfitProgramGeneratorService],
})
export class WorkoutsModule { }
