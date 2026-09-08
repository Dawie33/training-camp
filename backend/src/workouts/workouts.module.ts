import { Module } from '@nestjs/common'
import { ExercisesModule } from '../exercises/exercises.module'
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module'
import { WorkoutScheduleController } from './controllers/workout-schedule.controller'
import { WorkoutsController } from './controllers/workouts.controller'
import { AIWorkoutGeneratorService } from './services/ai-workout-generator.service'
import { UserContextService } from './services/user-context.service'
import { WorkoutScheduleService } from './services/workout-schedule.service'
import { WorkoutsService } from './services/workouts.service'

/**
 * Module workouts : CRUD des workouts et de leur planification, génération assistée
 * par IA (WODs) et agrégation du contexte utilisateur.
 * `UserContextService` est exporté pour être réutilisé par tout nouveau service IA.
 */
@Module({
  imports: [GoogleCalendarModule, ExercisesModule],
  controllers: [WorkoutsController, WorkoutScheduleController],
  providers: [WorkoutsService, AIWorkoutGeneratorService, WorkoutScheduleService, UserContextService],
  exports: [WorkoutsService, WorkoutScheduleService, UserContextService],
})
export class WorkoutsModule { }
