// backend/src/main.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import knex from 'knex';
import { resolve } from 'path';

async function runMigrations() {
  const logger = new Logger('Migrations');
  const db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : {
          host: process.env.DATABASE_HOST,
          port: Number(process.env.DATABASE_PORT ?? 5434),
          user: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME,
        },
    migrations: {
      directory: resolve(__dirname, 'database/migrations'),
    },
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
  await runMigrations();
  const app = await NestFactory.create(AppModule);

  // Sécurité basique

  // Préfixe global (optionnel) : http://localhost:3001/api/...
  app.setGlobalPrefix('api');
  app.enableCors();
  // Validation DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Permet les propriétés non listées
      transform: true,
      skipMissingProperties: false, // Valide même les propriétés manquantes
      transformOptions: {
        enableImplicitConversion: true, // Conversion automatique des types
      },
    }),
  );

  app.use(helmet());
  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Training Camp API running at http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start Nest application:', err);
  process.exit(1);
});
