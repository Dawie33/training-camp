import { config as dotenvConfig } from 'dotenv'
import { resolve, join } from 'path'
import type { Knex } from 'knex'

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
dotenvConfig({ path: resolve(__dirname, '../..', envFile) })

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
      directory: join(__dirname, 'migrations'),
    },
    seeds: {
      directory: join(__dirname, 'seeds'),
    },
    pool: { min: 0, max: 10 },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : {
          host: process.env.DATABASE_HOST,
          port: Number(process.env.DATABASE_PORT),
          user: process.env.DATABASE_USER,
          password: String(process.env.DATABASE_PASSWORD ?? ''),
          database: process.env.DATABASE_NAME,
          ssl: { rejectUnauthorized: false },
        },
    migrations: {
      directory: join(__dirname, 'migrations'),
    },
    seeds: {
      directory: join(__dirname, 'seeds'),
    },
    pool: { min: 2, max: 10 },
  },
  // Utilisé par Jest (qui définit NODE_ENV=test). Base dédiée, suffixée « _test », pour qu'un test
  // qui écrit en base ne touche jamais aux données de développement.
  test: {
    client: 'pg',
    connection: {
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      user: process.env.DATABASE_USER,
      password: String(process.env.DATABASE_PASSWORD ?? ''),
      database: `${process.env.DATABASE_NAME ?? 'training_camp'}_test`,
    },
    migrations: {
      directory: join(__dirname, 'migrations'),
    },
    seeds: {
      directory: join(__dirname, 'seeds'),
    },
    pool: { min: 0, max: 5 },
  },
}

/**
 * Retourne la configuration Knex de l'environnement demandé, ou lève une erreur explicite
 * s'il n'existe pas (au lieu de planter plus loin sur « reading 'client' » de undefined).
 */
export function getKnexConfig(env: string = process.env.NODE_ENV || 'development'): Knex.Config {
  const knexConfig = config[env]
  if (!knexConfig) {
    throw new Error(`Aucune configuration Knex pour NODE_ENV="${env}" (attendu : ${Object.keys(config).join(', ')})`)
  }
  return knexConfig
}

export default config
