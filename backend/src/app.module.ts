import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { KnexModule } from 'nest-knexjs'
import { AuthModule } from './auth/auth.module'
import { BikingModule } from './biking/biking.module'
import { AiModule } from './common/ai/ai.module'
import { envValidationSchema } from './common/config/env.validation'
import knexConfig from './database/knexfile'
import { EquipmentsModule } from './equipments/equipments.module'
import { ExercisesModule } from './exercises/exercises.module'
import { FitImportModule } from './fit-import/fit-import.module'
import { GoogleCalendarModule } from './google-calendar/google-calendar.module'
import { HealthcheckModule } from './healthcheck/healthcheck.module'
import { MobilityModule } from './mobility/mobility.module'
import { OneRepMaxesModule } from './one-rep-maxes/one-rep-maxes.module'
import { RecommendationsModule } from './recommendations/recommendations.module'
import { RunningModule } from './running/running.module'
import { ScheduledActivitiesModule } from './scheduled-activities/scheduled-activities.module'
import { SkillsModule } from './skills/skills.module'
import { StrengthModule } from './strength/strength.module'
import { TrackingModule } from './tracking/tracking.module'
import { UsersModule } from './users/users.module'
import { WorkoutSessionsModule } from './workout-sessions/workout-sessions.module'
import { WorkoutsModule } from './workouts/workouts.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    AiModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,  // 1 minute
        limit: 60,   // 60 requêtes par minute par IP (routes normales)
      },
    ]),
    KnexModule.forRoot({ config: knexConfig[process.env.NODE_ENV || 'development'] }),
    AuthModule,
    WorkoutsModule,
    WorkoutSessionsModule,
    HealthcheckModule,
    EquipmentsModule,
    ExercisesModule,
    UsersModule,
    SkillsModule,
    OneRepMaxesModule,
    GoogleCalendarModule,
    ScheduledActivitiesModule,
    RunningModule,
    BikingModule,
    StrengthModule,
    MobilityModule,
    FitImportModule,
    TrackingModule,
    RecommendationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }