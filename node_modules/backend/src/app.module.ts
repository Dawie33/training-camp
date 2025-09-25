import { Module } from '@nestjs/common'
import { KnexModule } from 'nest-knexjs'
import knexConfig from '../knexfile'
import { WorkoutsModule } from './workouts/workouts.module'
@Module({
  imports: [
    WorkoutsModule,
    KnexModule.forRoot({ config: knexConfig[process.env.NODE_ENV || 'developpement'] }),
  ],

})
export class AppModule {}
