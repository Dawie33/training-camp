import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { ExercisesController } from './exercises.controller'
import { ExercisesService } from './exercises.service'

describe('ExercisesController', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ExercisesController],
      providers: [
        {
          provide: ExercisesService,
          useValue: {
            findAll: async () => ({ rows: [], count: 0 }),
            findByName: async (name: string) => ({ name }),
          },
        },
      ],
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

  it('permet de lire le référentiel', async () => {
    await request(app.getHttpServer()).get('/exercises').expect(200)
  })

  it('permet de chercher un exercice par son nom', async () => {
    await request(app.getHttpServer()).get('/exercises/by-name/Thruster').expect(200, { name: 'Thruster' })
  })

  it.each([
    ['POST', '/exercises'],
    ['PATCH', '/exercises/3f1c2a4e-8b7d-4c1e-9a2f-5d6e7f8a9b0c'],
    ['DELETE', '/exercises/3f1c2a4e-8b7d-4c1e-9a2f-5d6e7f8a9b0c'],
  ])("n'expose pas %s %s : le référentiel commun est en lecture seule", async (method, path) => {
    await request(app.getHttpServer())[method.toLowerCase() as 'post' | 'patch' | 'delete'](path).expect(404)
  })
})
