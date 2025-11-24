import { config as dotenvConfig } from 'dotenv'
import { resolve } from 'path'
import type { Knex } from 'knex'

// Charge le fichier .env approprié selon NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env'
dotenvConfig({ path: resolve(__dirname, envFile) })

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      user: process.env.DATABASE_USER,
      password: String(process.env.DATABASE_PASSWORD ?? ''),
      database: process.env.DATABASE_NAME,
    },
   migrations: {
      directory: './src/database/migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    pool: { min: 0, max: 10 },
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: './src/database/migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    pool: { min: 2, max: 10 },
  },
};

export default config;