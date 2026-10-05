import { INestApplication } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import request from 'supertest'
import { HealthcheckModule } from './healthcheck.module'

describe('HealthcheckController', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        // Quota volontairement minuscule : sans @SkipThrottle, le 2e appel recevrait un 429
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 1 }]),
        HealthcheckModule,
      ],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile()

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('répond OK', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200, { status: 'OK' })
  })

  it("n'est pas soumis au quota de requêtes (appels répétés de Render)", async () => {
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer()).get('/api/health').expect(200)
    }
  })

  it("n'expose plus /info", async () => {
    await request(app.getHttpServer()).get('/api/info').expect(404)
  })
})
