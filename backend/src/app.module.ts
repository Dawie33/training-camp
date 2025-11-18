import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { KnexModule } from 'nest-knexjs'
import knexConfig from '../knexfile'
import { AuthModule } from './auth/auth.module'
import { envValidationSchema } from './common/config/env.validation'
import { EquipmentsModule } from './equipments/equipments.module'
import { ExercisesModule } from './exercises/exercises.module'
import { HealthcheckModule } from './healthcheck/healthcheck.module'
import { SportsModule } from './sports/sports.module'
import { UsersModule } from './users/users.module'
import { WorkoutsModule } from './workouts/workouts.module'
import { WorkoutSessionsModule } from './workout_sessions/workout_sessions.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    KnexModule.forRoot({ config: knexConfig[process.env.NODE_ENV || 'development'] }),
    AuthModule,
    WorkoutsModule,
    WorkoutSessionsModule,
    HealthcheckModule,
    SportsModule,
    EquipmentsModule,
    ExercisesModule,
    UsersModule
  ],
})
export class AppModule { }
