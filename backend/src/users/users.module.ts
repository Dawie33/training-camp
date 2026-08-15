import { Module } from "@nestjs/common"
import { WorkoutsModule } from "src/workouts/workouts.module"
import { UsersController } from "./users.controller"
import { UsersService } from "./users.service"

@Module({
    imports: [WorkoutsModule],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService], // Exporter pour que d'autres modules puissent l'utiliser
})

export class UsersModule { }