import { Module } from '@nestjs/common'
import { WorkoutsModule } from 'src/workouts/workouts.module'
import { RecommendationsController } from './recommendations.controller'
import { RecommendationsService } from './services/recommendations.service'

@Module({
  imports: [WorkoutsModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
