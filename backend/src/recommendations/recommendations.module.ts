import { Module } from '@nestjs/common'
import { TrainingProgramsModule } from 'src/training-programs/training-programs.module'
import { WorkoutsModule } from 'src/workouts/workouts.module'
import { RecommendationsController } from './recommendations.controller'
import { RecommendationsService } from './services/recommendations.service'

@Module({
  imports: [WorkoutsModule, TrainingProgramsModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
