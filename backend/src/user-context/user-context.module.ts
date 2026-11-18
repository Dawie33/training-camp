import { Module } from '@nestjs/common'
import { AnalyticsModule } from 'src/analytics/analytics.module'
import { UserContextService } from './user-context.service'

@Module({
  imports: [AnalyticsModule],
  providers: [UserContextService],
  exports: [UserContextService],
})
export class UserContextModule {}
