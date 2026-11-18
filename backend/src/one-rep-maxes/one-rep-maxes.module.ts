import { Module } from '@nestjs/common'
import { UserContextModule } from 'src/user-context/user-context.module'
import { OneRepMaxesController } from './one-rep-maxes.controller'
import { OneRepMaxesService } from './one-rep-maxes.service'

@Module({
  imports: [UserContextModule],
  controllers: [OneRepMaxesController],
  providers: [OneRepMaxesService],
  exports: [OneRepMaxesService],
})
export class OneRepMaxesModule {}
