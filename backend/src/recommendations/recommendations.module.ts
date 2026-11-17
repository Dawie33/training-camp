import { Module } from '@nestjs/common'
import { WorkoutsModule } from 'src/workouts/workouts.module'
import { RecommendationsController } from './recommendations.controller'
import { DailySessionService } from './services/daily-session.service'
import { RecommendationsService } from './services/recommendations.service'
import { DailyCoachStore } from './services/daily-coach-store.service'

@Module({
  imports: [WorkoutsModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, DailySessionService, DailyCoachStore],
  exports: [RecommendationsService, DailySessionService],
})
export class RecommendationsModule {}
