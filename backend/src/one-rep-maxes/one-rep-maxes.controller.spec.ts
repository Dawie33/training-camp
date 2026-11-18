import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { OneRepMaxesController } from './one-rep-maxes.controller'
import { OneRepMaxesService } from './one-rep-maxes.service'

describe('OneRepMaxesController — PUT /one-rep-maxes/:lift', () => {
  let app: INestApplication
  const upsert = jest.fn().mockResolvedValue({ lift: 'back_squat', value: 150 })
  const deleteHistory = jest.fn().mockResolvedValue(undefined)
  let authenticated = true

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OneRepMaxesController],
      providers: [{ provide: OneRepMaxesService, useValue: { upsert, deleteHistory } }],
    })
      // Utilisateur connecté fictif : on teste la validation, pas l'authentification
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          if (!authenticated) return false
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

  beforeEach(() => {
    upsert.mockClear()
    deleteHistory.mockClear()
    authenticated = true
  })

  afterAll(async () => {
    await app.close()
  })

  const put = (lift: string, body: Record<string, unknown>) =>
    request(app.getHttpServer()).put(`/one-rep-maxes/${lift}`).send(body)

  it("enregistre un 1RM valide pour l'utilisateur connecté", async () => {
    await put('back_squat', { value: 152.5, source: 'real' }).expect(200)

    expect(upsert).toHaveBeenCalledWith('user-1', 'back_squat', 152.5, 'real', undefined)
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

  it.each(['2020-06-15', '2020-06-15T12:00:00Z', '2020-06-15T14:00:00+02:00'])(
    'transmet une date passée valide %s',
    async measured_at => {
      await put('back_squat', { value: 150, source: 'real', measured_at }).expect(200)
      expect(upsert).toHaveBeenCalledWith('user-1', 'back_squat', 150, 'real', measured_at)
    }
  )

  it.each(['2999-01-01', '2026-02-30', 'not-a-date', '2020-01-01T12:00:00', '', null])(
    'rejette une date invalide ou future %s',
    async measured_at => {
      await put('back_squat', { value: 150, source: 'real', measured_at }).expect(400)
      expect(upsert).not.toHaveBeenCalled()
    }
  )

  it("évalue aujourd'hui à Paris à chaque requête, même avant minuit UTC", async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] }).setSystemTime(new Date('2026-01-10T23:30:00Z'))
    try {
      await put('back_squat', { value: 150, source: 'real', measured_at: '2026-01-11' }).expect(200)
      await put('back_squat', { value: 150, source: 'real', measured_at: '2026-01-12' }).expect(400)
      await put('back_squat', { value: 150, source: 'real', measured_at: '2026-01-10T23:30:01Z' }).expect(400)
    } finally {
      jest.useRealTimers()
    }
  })

  const historyId = 'c0d0e0f0-1234-4234-8234-123456789abc'

  it('supprime pour le propriétaire authentifié et valide le UUID', async () => {
    await request(app.getHttpServer()).delete(`/one-rep-maxes/history/${historyId}`).expect(204)
    expect(deleteHistory).toHaveBeenCalledWith('user-1', historyId)
    deleteHistory.mockClear()
    await request(app.getHttpServer()).delete('/one-rep-maxes/history/invalid').expect(400)
    expect(deleteHistory).not.toHaveBeenCalled()
  })

  it('protège insertion et suppression avec le guard', async () => {
    authenticated = false
    await put('back_squat', { value: 150, source: 'real' }).expect(403)
    await request(app.getHttpServer()).delete(`/one-rep-maxes/history/${historyId}`).expect(403)
    expect(upsert).not.toHaveBeenCalled()
    expect(deleteHistory).not.toHaveBeenCalled()
  })
})
