import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { OneRepMaxesController } from './one-rep-maxes.controller'
import { OneRepMaxesService } from './one-rep-maxes.service'

describe('OneRepMaxesController — PUT /one-rep-maxes/:lift', () => {
  let app: INestApplication
  const upsert = jest.fn().mockResolvedValue({ lift: 'back_squat', value: 150 })

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OneRepMaxesController],
      providers: [{ provide: OneRepMaxesService, useValue: { upsert } }],
    })
      // Utilisateur connecté fictif : on teste la validation, pas l'authentification
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = { id: 'user-1' }
          return true
        },
      })
      .compile()

    app = moduleRef.createNestApplication()
    // Mêmes options que le ValidationPipe global de main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      })
    )
    await app.init()
  })

  beforeEach(() => upsert.mockClear())

  afterAll(async () => {
    await app.close()
  })

  const put = (lift: string, body: Record<string, unknown>) =>
    request(app.getHttpServer()).put(`/one-rep-maxes/${lift}`).send(body)

  it("enregistre un 1RM valide pour l'utilisateur connecté", async () => {
    await put('back_squat', { value: 152.5, source: 'real' }).expect(200)

    expect(upsert).toHaveBeenCalledWith('user-1', 'back_squat', 152.5, 'real')
  })

  it.each(['backsquat', 'Back_squat', 'pomme'])('rejette le mouvement inconnu « %s »', async lift => {
    await put(lift, { value: 150, source: 'real' }).expect(400)
    expect(upsert).not.toHaveBeenCalled()
  })

  it.each([
    ['0 kg', 0],
    ['une valeur négative', -10],
    ['une valeur au-delà de 500 kg (saisie 1 500 au lieu de 150)', 1500],
    ['plus de 2 décimales', 150.125],
  ])('rejette %s', async (_case, value) => {
    await put('back_squat', { value, source: 'real' }).expect(400)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('rejette une source inconnue', async () => {
    await put('back_squat', { value: 150, source: 'devine' }).expect(400)
  })
})
