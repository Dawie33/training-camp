import { Module } from '@nestjs/common'
import { UsersModule } from 'src/users/users.module'
import { WorkoutsService } from './services/workouts.service'
import { WorkoutsController } from './workouts.controller'
import { AIWorkoutGeneratorService } from './services/ai-workout-generator.service'

@Module({
  imports: [UsersModule], // Importer UsersModule pour accéder à UsersService
  controllers: [WorkoutsController],
  providers: [WorkoutsService, AIWorkoutGeneratorService],
  exports: [WorkoutsService],
})
export class WorkoutsModule { }
