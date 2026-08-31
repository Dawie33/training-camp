import { Module } from '@nestjs/common'
import { WorkoutsModule } from 'src/workouts/workouts.module'
import { TrainingProgramsController } from './training-programs.controller'
import { TrainingProgramsService } from './training-programs.service'

@Module({
  imports: [WorkoutsModule],
  controllers: [TrainingProgramsController],
  providers: [TrainingProgramsService],
  exports: [TrainingProgramsService],
})
export class TrainingProgramsModule { }
