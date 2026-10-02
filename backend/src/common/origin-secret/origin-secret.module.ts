import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { OriginSecretMiddleware } from './origin-secret.middleware'

@Module({})
export class OriginSecretModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(OriginSecretMiddleware)
      // Le health check de Render appelle l'API en direct, sans passer par Vercel
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes('*')
  }
}
