import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { EquipmentsController } from './equipments.controller'
import { EquipmentsService } from './equipments.service'

describe('EquipmentsController', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EquipmentsController],
      providers: [{ provide: EquipmentsService, useValue: { findAll: async () => ({ rows: [], count: 0 }) } }],
    })
      // Utilisateur connecté : on teste les routes exposées, pas l'authentification
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('permet de lire le catalogue', async () => {
    await request(app.getHttpServer()).get('/equipments').expect(200)
  })

  it.each([
    ['POST', '/equipments'],
    ['PATCH', '/equipments/barbell'],
    ['DELETE', '/equipments/barbell'],
  ])("n'expose pas %s %s : le catalogue commun est en lecture seule", async (method, path) => {
    await request(app.getHttpServer())[method.toLowerCase() as 'post' | 'patch' | 'delete'](path).expect(404)
  })
})
