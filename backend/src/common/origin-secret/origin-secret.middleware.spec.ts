import { Controller, Get, INestApplication } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ORIGIN_SECRET_HEADER } from './origin-secret.middleware'
import { OriginSecretModule } from './origin-secret.module'

const SECRET = 'a'.repeat(64)

@Controller()
class DummyController {
  @Get('health')
  health() {
    return { status: 'OK' }
  }

  @Get('workouts')
  workouts() {
    return []
  }
}

async function createApp(secret: string | undefined): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), OriginSecretModule],
    controllers: [DummyController],
  })
    .overrideProvider(ConfigService)
    .useValue({ get: () => secret })
    .compile()

  const app = moduleRef.createNestApplication()
  app.setGlobalPrefix('api')
  await app.init()
  return app
}

describe('OriginSecretMiddleware', () => {
  let app: INestApplication

  afterEach(async () => {
    await app.close()
  })

  describe('sans ORIGIN_SECRET (dev local)', () => {
    beforeEach(async () => {
      app = await createApp(undefined)
    })

    it('laisse passer les requêtes sans en-tête', async () => {
      await request(app.getHttpServer()).get('/api/workouts').expect(200)
    })
  })

  describe('avec ORIGIN_SECRET', () => {
    beforeEach(async () => {
      app = await createApp(SECRET)
    })

    it('refuse une requête sans en-tête (appel direct à Render)', async () => {
      await request(app.getHttpServer()).get('/api/workouts').expect(403)
    })

    it('refuse un secret faux de même longueur', async () => {
      await request(app.getHttpServer())
        .get('/api/workouts')
        .set(ORIGIN_SECRET_HEADER, 'b'.repeat(64))
        .expect(403)
    })

    it('refuse un secret de longueur différente', async () => {
      await request(app.getHttpServer()).get('/api/workouts').set(ORIGIN_SECRET_HEADER, 'a').expect(403)
    })

    it('accepte le bon secret', async () => {
      await request(app.getHttpServer()).get('/api/workouts').set(ORIGIN_SECRET_HEADER, SECRET).expect(200)
    })

    it('laisse passer le health check sans en-tête', async () => {
      await request(app.getHttpServer()).get('/api/health').expect(200)
    })
  })
})
