import 'dotenv/config'

import type { Knex } from 'knex'

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
};

export default config;