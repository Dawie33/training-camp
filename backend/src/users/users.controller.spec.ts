import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

describe('UsersController - preferences de profil', () => {
  let app: INestApplication
  let authenticated = true
  const update = jest.fn().mockImplementation((_id, data) => Promise.resolve(data))

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: { update } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          if (!authenticated) return false
          context.switchToHttp().getRequest().user = { id: 'owner' }
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

  beforeEach(() => {
    update.mockClear()
    authenticated = true
  })
  afterAll(() => app.close())

  it('transmet les preferences validees pour le proprietaire authentifie', async () => {
    const body = {
      global_goals: { endurance: true },
      training_preferences: { preferred_duration: 45 },
      physical_limitations: ['Mobilite limitee'],
      schedule_preferences: { available_days: ['monday'] },
      dateOfBirth: '1990-06-15',
      gender: 'female',
      resting_heart_rate: 50,
    }
    await request(app.getHttpServer()).patch('/users/me').send(body).expect(200).expect(body)
    expect(update).toHaveBeenCalledWith('owner', expect.objectContaining(body))
  })

  it('rejette les inconnus imbriques sans appeler la persistence', async () => {
    await request(app.getHttpServer())
      .patch('/users/me')
      .send({ schedule_preferences: { available_days: ['monday'], auto_schedule: true } })
      .expect(400)
    expect(update).not.toHaveBeenCalled()
  })

  it('protege le profil par le guard', async () => {
    authenticated = false
    await request(app.getHttpServer()).patch('/users/me').send({ resting_heart_rate: 50 }).expect(403)
    expect(update).not.toHaveBeenCalled()
  })
})
