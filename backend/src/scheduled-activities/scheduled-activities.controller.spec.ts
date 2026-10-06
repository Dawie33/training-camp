import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { SCHEDULED_ACTIVITY_NOTES_MAX_LENGTH } from './dto/scheduled-activity.dto'
import { ScheduledActivitiesController } from './scheduled-activities.controller'
import { ScheduledActivitiesService } from './scheduled-activities.service'

describe('ScheduledActivitiesController', () => {
  let app: INestApplication
  const service = { update: jest.fn().mockResolvedValue({}), delete: jest.fn().mockResolvedValue({ success: true }) }
  const id = '3f1c2a4e-8b7d-4c1e-9a2f-5d6e7f8a9b0c'

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ScheduledActivitiesController],
      providers: [{ provide: ScheduledActivitiesService, useValue: service }],
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

  afterAll(async () => {
    await app.close()
  })

  it.each([
    ['PATCH', '/scheduled-activities/abc'],
    ['DELETE', '/scheduled-activities/abc'],
    ['PATCH', '/scheduled-activities/abc/complete'],
    ['PATCH', '/scheduled-activities/abc/skip'],
  ])("répond 400 (et non 500) à %s %s : id qui n'est pas un UUID", async (method, path) => {
    await request(app.getHttpServer())[method.toLowerCase() as 'patch' | 'delete'](path).expect(400)
  })

  it('accepte un UUID valide', async () => {
    await request(app.getHttpServer()).delete(`/scheduled-activities/${id}`).expect(200)
    expect(service.delete).toHaveBeenCalledWith(id, 'user-1')
  })

  it(`refuse des notes de plus de ${SCHEDULED_ACTIVITY_NOTES_MAX_LENGTH} caractères`, async () => {
    await request(app.getHttpServer())
      .patch(`/scheduled-activities/${id}`)
      .send({ notes: 'a'.repeat(SCHEDULED_ACTIVITY_NOTES_MAX_LENGTH + 1) })
      .expect(400)
  })
})
