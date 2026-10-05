// backend/src/main.ts
import './env'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { Logger, ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import knex from 'knex'
import { resolve } from 'path'
import { readdirSync } from 'fs'

/**
 * Custom migration source : lit les fichiers .js compilés dans dist/
 * mais les nomme en .ts pour correspondre aux entrées déjà enregistrées
 * dans la table knex_migrations (créées depuis l'environnement de dev avec ts-node).
 */
const migrationSource = {
  getMigrations(): Promise<string[]> {
    const dir = resolve(__dirname, 'database/migrations')
    const files = readdirSync(dir)
      .filter(f => f.endsWith('.js'))
      .sort()
    return Promise.resolve(files)
  },

  getMigrationName(migration: string): string {
    // Renomme "xxxx_foo.js" → "xxxx_foo.ts" pour correspondre à la table knex_migrations
    return migration.replace(/\.js$/, '.ts')
  },

  getMigration(
    migration: string
  ): Promise<{ up: (knex: unknown) => Promise<void>; down: (knex: unknown) => Promise<void> }> {
    const filePath = resolve(__dirname, 'database/migrations', migration)
    return import(filePath)
  },
}

async function runMigrations() {
  const logger = new Logger('Migrations')
  const db = knex({
    client: 'pg',
    connection:
      process.env.DATABASE_URL && process.env.NODE_ENV === 'production'
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
          }
        : {
            host: process.env.DATABASE_HOST,
            port: Number(process.env.DATABASE_PORT ?? 5432),
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
          },
    migrations: { migrationSource },
  })
  try {
    const [batch, migrations] = await db.migrate.latest()
    if (migrations.length === 0) {
      logger.log('Database already up to date')
    } else {
      logger.log(`Batch ${batch} — applied ${migrations.length} migration(s): ${migrations.join(', ')}`)
    }
  } finally {
    await db.destroy()
  }
}

async function bootstrap() {
  await runMigrations()
  // En production : pas de logs debug/verbose (bruit inutile, et risque d'y écrire des données personnelles)
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['fatal', 'error', 'warn', 'log'] : undefined,
  })
  const logger = new Logger('Bootstrap')
  const config = app.get(ConfigService)

  // En prod, les requêtes traversent Vercel (rewrite /api) puis le proxy Render :
  // sans 'trust proxy', req.ip est l'IP du dernier proxy et le rate limiting est partagé par tous.
  const trustProxy = config.get<number>('TRUST_PROXY', 0)
  if (trustProxy > 0) {
    app.set('trust proxy', trustProxy)
  }
  logger.log(`trust proxy: ${trustProxy}`)

  app.setGlobalPrefix('api')
  // Obligatoire en production (Joi) : l'app refuse de démarrer si elle manque
  app.enableCors({
    origin: config.getOrThrow<string>('FRONTEND_URL'),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  )

  app.use(helmet())
  app.use(cookieParser())
  const port = parseInt(process.env.PORT ?? '3001', 10)
  await app.listen(port)
  logger.log(`Training Camp API running at http://localhost:${port}`)
}

bootstrap().catch(err => {
  console.error('Failed to start Nest application:', err)
  process.exit(1)
})
