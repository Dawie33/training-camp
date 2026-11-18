import { Module } from '@nestjs/common'
import { UserContextModule } from 'src/user-context/user-context.module'
import { TrackingController } from './tracking.controller'
import { TrackingService } from './tracking.service'

@Module({
  imports: [UserContextModule],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
