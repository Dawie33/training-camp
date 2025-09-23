import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import knex, { Knex } from 'knex'

@Injectable()
export class KnexService implements OnModuleInit, OnModuleDestroy {
  private _knex: Knex;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const dbConfig = this.configService.get('database');
    
    this._knex = knex({
      client: dbConfig.client,
      connection: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
        password: dbConfig.password,
      },
      pool: dbConfig.pool,
      acquireConnectionTimeout: dbConfig.acquireConnectionTimeout,
      debug: dbConfig.debug,
    });
    
    try {
      await this._knex.raw('SELECT 1');
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  get instance(): Knex {
    return this._knex;
  }

  async onModuleDestroy() {
    await this._knex.destroy();
  }
}