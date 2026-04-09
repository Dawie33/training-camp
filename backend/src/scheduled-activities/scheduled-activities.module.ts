import { Module } from '@nestjs/common'
import { ScheduledActivitiesController } from './scheduled-activities.controller'
import { ScheduledActivitiesService } from './scheduled-activities.service'

@Module({
  controllers: [ScheduledActivitiesController],
  providers: [ScheduledActivitiesService],
  exports: [ScheduledActivitiesService],
})
export class ScheduledActivitiesModule {}
