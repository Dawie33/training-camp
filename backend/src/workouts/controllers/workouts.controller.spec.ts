import { ExecutionContext, INestApplication } from '@nestjs/common'
import { GUARDS_METADATA } from '@nestjs/common/constants'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { AIWorkoutGeneratorService } from '../services/ai-workout-generator.service'
import { WorkoutsService } from '../services/workouts.service'
import { WorkoutsController } from './workouts.controller'

describe('WorkoutsController', () => {
  let app: INestApplication
  const workoutsService = {
    checkAndScheduleMonthlyBenchmark: jest.fn().mockResolvedValue({ scheduled: true }),
    findOne: jest.fn().mockResolvedValue({ id: 'w-1' }),
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WorkoutsController],
      providers: [
        { provide: WorkoutsService, useValue: workoutsService },
        { provide: AIWorkoutGeneratorService, useValue: {} },
      ],
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

  describe('check-monthly-benchmark', () => {
    it('planifie le benchmark mensuel en POST', async () => {
      await request(app.getHttpServer()).post('/workouts/check-monthly-benchmark').expect(201)
      expect(workoutsService.checkAndScheduleMonthlyBenchmark).toHaveBeenCalledWith('user-1')
    })

    it('répond 404 en GET sans rien planifier ni interroger la base', async () => {
      // Sans ParseUUIDPipe, le GET tomberait sur GET /workouts/:id et Postgres planterait (500)
      await request(app.getHttpServer()).get('/workouts/check-monthly-benchmark').expect(404)
      expect(workoutsService.checkAndScheduleMonthlyBenchmark).not.toHaveBeenCalled()
      expect(workoutsService.findOne).not.toHaveBeenCalled()
    })

    it('reste protégée par JwtAuthGuard', () => {
      const handler = WorkoutsController.prototype.checkMonthlyBenchmark
      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(JwtAuthGuard)
    })
  })

  it('GET /workouts/:id accepte toujours un UUID valide', async () => {
    const id = '3f1c2a4e-8b7d-4c1e-9a2f-5d6e7f8a9b0c'
    await request(app.getHttpServer()).get(`/workouts/${id}`).expect(200)
    expect(workoutsService.findOne).toHaveBeenCalledWith(id)
  })
})
