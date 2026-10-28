import { ExecutionContext, INestApplication } from '@nestjs/common'
import { GUARDS_METADATA } from '@nestjs/common/constants'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RecommendationsController } from './recommendations.controller'
import { DailySessionService } from './services/daily-session.service'

describe('RecommendationsController', () => {
  let app: INestApplication
  const dailySessionService = {
    checkAndGenerateDailySession: jest.fn().mockResolvedValue({ status: 'planned' }),
    generateProposal: jest.fn().mockResolvedValue({}),
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RecommendationsController],
      providers: [{ provide: DailySessionService, useValue: dailySessionService }],
    })
      // Utilisateur connecté fictif : on teste la méthode HTTP, pas l'authentification
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = { id: 'user-1' }
          return true
        },
      })
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('daily-session/check', () => {
    it('génère la séance du jour en POST', async () => {
      await request(app.getHttpServer()).post('/recommendations/daily-session/check').expect(201)
      expect(dailySessionService.checkAndGenerateDailySession).toHaveBeenCalledWith('user-1')
    })

    it("répond 404 en GET et n'appelle pas l'IA", async () => {
      await request(app.getHttpServer()).get('/recommendations/daily-session/check').expect(404)
      expect(dailySessionService.checkAndGenerateDailySession).not.toHaveBeenCalled()
    })

    it('garde la limite de 10 requêtes par minute', () => {
      const handler = RecommendationsController.prototype.checkDailySession
      expect(Reflect.getMetadata('THROTTLER:LIMITdefault', handler)).toBe(10)
      expect(Reflect.getMetadata('THROTTLER:TTLdefault', handler)).toBe(60000)
    })
  })

  it('protège tout le contrôleur par JwtAuthGuard', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, RecommendationsController)).toContain(JwtAuthGuard)
  })
})
