// backend/src/main.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
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
