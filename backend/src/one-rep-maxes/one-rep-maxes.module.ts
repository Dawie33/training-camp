import { Module } from '@nestjs/common'
import { WorkoutsModule } from 'src/workouts/workouts.module'
import { OneRepMaxesController } from './one-rep-maxes.controller'
import { OneRepMaxesService } from './one-rep-maxes.service'

@Module({
  imports: [WorkoutsModule],
  controllers: [OneRepMaxesController],
  providers: [OneRepMaxesService],
  exports: [OneRepMaxesService],
})
export class OneRepMaxesModule {}
