import { Module } from '@nestjs/common'
import { KnexModule } from 'nest-knexjs'
import knexConfig from '../knexfile'
import { HealthcheckModule } from './healthcheck/healthcheck.module'
import { SportsModule } from './sports/sports.module'
import { WorkoutsModule } from './workouts/workouts.module'
@Module({
  imports: [
    KnexModule.forRoot({ config: knexConfig[process.env.NODE_ENV || 'development'] }),
    WorkoutsModule,
    HealthcheckModule,
    SportsModule,
  ],

})
export class AppModule {}
