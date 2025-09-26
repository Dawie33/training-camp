import { Module } from '@nestjs/common'
import { KnexModule } from 'nest-knexjs'
import knexConfig from '../knexfile'
import { HealthcheckModule } from './healthcheck/healthcheck.module'
import { WorkoutsModule } from './workouts/workouts.module'
@Module({
  imports: [
    WorkoutsModule,
    HealthcheckModule,
    KnexModule.forRoot({ config: knexConfig[process.env.NODE_ENV || 'development'] }),
  ],

})
export class AppModule {}
