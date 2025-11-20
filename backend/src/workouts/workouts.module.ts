import { Module } from '@nestjs/common'
import { UsersModule } from 'src/users/users.module'
import { WorkoutScheduleController } from './controllers/workout-schedule.controller'
import { WorkoutsController } from './controllers/workouts.controller'
import { AIWorkoutGeneratorService } from './services/ai-workout-generator.service'
import { WorkoutScheduleService } from './services/workout-schedule.service'
import { WorkoutsService } from './services/workouts.service'

@Module({
  imports: [UsersModule], // Importer UsersModule pour accéder à UsersService
  controllers: [WorkoutsController, WorkoutScheduleController],
  providers: [WorkoutsService, AIWorkoutGeneratorService, WorkoutScheduleService],
  exports: [WorkoutsService, WorkoutScheduleService],
})
export class WorkoutsModule { }
