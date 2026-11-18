import { Module } from '@nestjs/common'
import { UserContextModule } from 'src/user-context/user-context.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [UserContextModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Exporter pour que d'autres modules puissent l'utiliser
})
export class UsersModule {}
