import { Module } from '@nestjs/common'
import { WorkoutsModule } from 'src/workouts/workouts.module'
import { TrackingController } from './tracking.controller'
import { TrackingService } from './tracking.service'

@Module({
  imports: [WorkoutsModule],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
