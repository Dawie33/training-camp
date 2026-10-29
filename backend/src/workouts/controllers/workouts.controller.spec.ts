import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common'
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
    create: jest.fn().mockResolvedValue({ id: 'w-2' }),
    findAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }),
    getBenchmarkWorkouts: jest.fn().mockResolvedValue({ rows: [], count: 0 }),
    update: jest.fn().mockResolvedValue({ id: 'w-1' }),
    remove: jest.fn().mockResolvedValue({ success: true }),
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
    // Mêmes options que main.ts : un champ inconnu du DTO est refusé
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
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

  describe('POST /workouts', () => {
    it("enregistre l'utilisateur connecté comme auteur", async () => {
      await request(app.getHttpServer()).post('/workouts').send({ name: 'Mon WOD' }).expect(201)
      expect(workoutsService.create).toHaveBeenCalledWith({ name: 'Mon WOD' }, 'user-1')
    })

    it('refuse un auteur choisi par le client (400) sans rien créer', async () => {
      await request(app.getHttpServer())
        .post('/workouts')
        .send({ name: 'Mon WOD', created_by_user_id: '3f1c2a4e-8b7d-4c1e-9a2f-5d6e7f8a9b0c' })
        .expect(400)
      expect(workoutsService.create).not.toHaveBeenCalled()
    })
  })

  it('GET /workouts/:id accepte toujours un UUID valide', async () => {
    const id = '3f1c2a4e-8b7d-4c1e-9a2f-5d6e7f8a9b0c'
    await request(app.getHttpServer()).get(`/workouts/${id}`).expect(200)
    expect(workoutsService.findOne).toHaveBeenCalledWith(id, { id: 'user-1' })
  })

  it("GET /workouts/:id répond 404 quand le workout n'est pas visible par l'utilisateur", async () => {
    workoutsService.findOne.mockResolvedValueOnce(null)
    await request(app.getHttpServer()).get('/workouts/3f1c2a4e-8b7d-4c1e-9a2f-5d6e7f8a9b0c').expect(404)
  })

  it("GET /workouts et GET /workouts/benchmark filtrent selon l'utilisateur connecté", async () => {
    await request(app.getHttpServer()).get('/workouts').expect(200)
    await request(app.getHttpServer()).get('/workouts/benchmark').expect(200)
    expect(workoutsService.findAll).toHaveBeenCalledWith(expect.any(Object), { id: 'user-1' })
    expect(workoutsService.getBenchmarkWorkouts).toHaveBeenCalledWith({ id: 'user-1' })
  })

  describe('PATCH et DELETE /workouts/:id', () => {
    const id = '3f1c2a4e-8b7d-4c1e-9a2f-5d6e7f8a9b0c'

    it("transmettent l'utilisateur connecté pour vérifier ses droits", async () => {
      await request(app.getHttpServer()).patch(`/workouts/${id}`).send({ name: 'Renommé' }).expect(200)
      await request(app.getHttpServer()).delete(`/workouts/${id}`).expect(200)
      expect(workoutsService.update).toHaveBeenCalledWith(id, { name: 'Renommé' }, { id: 'user-1' })
      expect(workoutsService.remove).toHaveBeenCalledWith(id, { id: 'user-1' })
    })

    it("répondent 404 sur un id qui n'est pas un UUID, sans interroger la base", async () => {
      await request(app.getHttpServer()).patch('/workouts/pas-un-uuid').send({ name: 'x' }).expect(404)
      await request(app.getHttpServer()).delete('/workouts/pas-un-uuid').expect(404)
      expect(workoutsService.update).not.toHaveBeenCalled()
      expect(workoutsService.remove).not.toHaveBeenCalled()
    })
  })
})
