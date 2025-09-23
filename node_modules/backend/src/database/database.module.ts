import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config/dist/config.module'
import databaseConfig from './config/database.config'
import { KnexService } from './knex.service'

@Global()
@Module({
      imports: [
    ConfigModule.forFeature(databaseConfig),
  ],
  providers: [KnexService],
  exports: [KnexService],
})
export class DatabaseModule {}