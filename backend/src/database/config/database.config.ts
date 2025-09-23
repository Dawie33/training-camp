import { registerAs } from '@nestjs/config'

export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'training_camp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  
  // Configuration Knex
  client: 'postgresql',
  
  // Pool de connexions
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },
  
  // Timeouts
  acquireConnectionTimeout: parseInt(process.env.DB_TIMEOUT || '60000', 10),
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
  
  // Migrations
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations',
  },
  
  // Seeds
  seeds: {
    directory: './src/database/seeds',
  },
}));