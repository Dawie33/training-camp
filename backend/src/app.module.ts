import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { KnexModule } from 'nest-knexjs'
import knexConfig from '../knexfile'
import { AuthModule } from './auth/auth.module'
import { envValidationSchema } from './common/config/env.validation'
import { EquipmentsModule } from './equipments/equipments.module'
import { HealthcheckModule } from './healthcheck/healthcheck.module'
import { SportsModule } from './sports/sports.module'
import { WorkoutsModule } from './workouts/workouts.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    KnexModule.forRoot({ config: knexConfig[process.env.NODE_ENV || 'development'] }),
    AuthModule,
    WorkoutsModule,
    HealthcheckModule,
    SportsModule,
    EquipmentsModule
  ],
})
export class AppModule { }
