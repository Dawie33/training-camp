import { Module } from '@nestjs/common'
import { EquipmentsModule } from '../equipments/equipments.module'
import { ExercisesModule } from '../exercises/exercises.module'
import { WorkoutsModule } from '../workouts/workouts.module'
import { AIWorkoutGeneratorService } from '../workouts/services/ai-workout-generator.service'
import { AdminEquipmentsController } from './controllers/admin-equipments.controller'
import { AdminExercisesController } from './controllers/admin-exercises.controller'
import { AdminUsersController } from './controllers/admin-users.controller'
import { AdminWorkoutsController } from './controllers/admin-workouts.controller'
import { AdminController } from './controllers/admin.controller'
import { AdminEquipmentsService } from './services/admin-equipments.service'
import { AdminExercicesService } from './services/admin-exercises.service'
import { AdminUsersService } from './services/admin-users.service'
import { AdminWorkoutService } from './services/admin-workouts.service'
import { AdminService } from './services/admin.service'

@Module({
  imports: [ExercisesModule, EquipmentsModule, WorkoutsModule],
  controllers: [
    AdminController,
    AdminExercisesController,
    AdminEquipmentsController,
    AdminUsersController,
    AdminWorkoutsController
  ],
  providers: [
    AdminEquipmentsService,
    AdminExercicesService,
    AdminUsersService,
    AdminWorkoutService,
    AdminService,
    AIWorkoutGeneratorService
  ],
})
export class AdminModule { }
