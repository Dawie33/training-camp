import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WorkoutSessionsController } from './workout-sessions.controller'
import { WorkoutSessionsService } from './workout-sessions.service'
import { WorkoutAnalysisService } from './workout-analysis.service'
import { WorkoutsController } from '../workouts/controllers/workouts.controller'
import { WorkoutsService } from '../workouts/services/workouts.service'
import { AIWorkoutGeneratorService } from '../workouts/services/ai-workout-generator.service'

describe('Workout HTTP validation', () => {
  let app: INestApplication
  const sessions = { findAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }), create: jest.fn() }
  const workouts = { update: jest.fn().mockResolvedValue({}) }
  const id = 'cf4a48ca-4bfc-4ed1-bf8e-1b8869e5e580'

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WorkoutSessionsController, WorkoutsController],
      providers: [
        { provide: WorkoutSessionsService, useValue: sessions },
        { provide: WorkoutAnalysisService, useValue: {} },
        { provide: WorkoutsService, useValue: workouts },
        { provide: AIWorkoutGeneratorService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          context.switchToHttp().getRequest().user = { id: 'user', role: 'user' }
          return true
        },
      })
      .compile()
    app = moduleRef.createNestApplication()
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

  afterAll(() => app.close())

  it.each(['abc', '-1', '0', '101', '1.5'])('refuse limit=%s avant accès base', async limit => {
    await request(app.getHttpServer()).get(`/workout-sessions?limit=${limit}`).expect(400)
  })

  it.each(['abc', '-1', '1.5'])('refuse offset=%s', async offset => {
    await request(app.getHttpServer()).get(`/workout-sessions?offset=${offset}`).expect(400)
  })

  it('transforme la pagination valide et applique les valeurs par défaut', async () => {
    await request(app.getHttpServer()).get('/workout-sessions?limit=100&offset=50').expect(200)
    expect(sessions.findAll).toHaveBeenLastCalledWith('user', 100, 50)
    await request(app.getHttpServer()).get('/workout-sessions').expect(200)
    expect(sessions.findAll).toHaveBeenLastCalledWith('user', 50, 0)
  })

  it.each(['started_at', 'completed_at'])('refuse une date %s invalide', async key => {
    await request(app.getHttpServer())
      .post('/workout-sessions')
      .send({ [key]: 'pas une date' })
      .expect(400)
    await request(app.getHttpServer())
      .post('/workout-sessions')
      .send({ [key]: null })
      .expect(400)
  })

  it.each(['/workout-sessions/abc', '/workout-sessions/workout/abc'])('refuse un UUID invalide : %s', async path => {
    await request(app.getHttpServer()).get(path).expect(400)
  })

  it('accepte un PATCH partiel du benchmark', async () => {
    await request(app.getHttpServer()).patch(`/workouts/${id}`).send({ is_benchmark: true }).expect(200)
    expect(workouts.update).toHaveBeenCalledWith(id, { is_benchmark: true }, { id: 'user', role: 'user' })
  })

  it.each(['created_by_user_id', 'usage_count', 'average_rating', 'total_ratings'])(
    'refuse le champ serveur %s',
    async key => {
      await request(app.getHttpServer())
        .post('/workouts')
        .send({ [key]: 1 })
        .expect(400)
    }
  )

  it('refuse les faux objets JSON et le nom client de benchmark', async () => {
    await request(app.getHttpServer()).post('/workouts').send({ blocks: 'pas du json' }).expect(400)
    await request(app.getHttpServer())
      .post('/workouts/benchmark-result')
      .send({ workoutId: id, workoutName: 'Murph', result: { time_seconds: 300 } })
      .expect(400)
  })

  it('refuse de remplacer les résultats par null', async () => {
    await request(app.getHttpServer()).patch(`/workout-sessions/${id}`).send({ results: null }).expect(400)
  })

  it.each([
    ['/workouts/parse-text', { text: 'a'.repeat(5001) }],
    ['/workouts/lookup', { name: 'a'.repeat(101) }],
    ['/workouts/lookup', { name: 'Fran', referenceData: 'a'.repeat(5001) }],
  ])('borne les textes IA de %s', async (path, body) => {
    await request(app.getHttpServer()).post(path).send(body).expect(400)
  })
})
