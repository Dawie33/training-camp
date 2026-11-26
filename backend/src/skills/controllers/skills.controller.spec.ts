import { ExecutionContext, INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { AISkillGeneratorService } from '../services/ai-skill-generator.service'
import { SkillsService } from '../services/skills.service'
import { SkillsController } from './skills.controller'

describe('SkillsController UUID validation', () => {
  let app: INestApplication
  const service = {
    findOne: jest.fn().mockResolvedValue({}),
    getStepLogs: jest.fn().mockResolvedValue([]),
    updateStep: jest.fn().mockResolvedValue({}),
    updateProgram: jest.fn().mockResolvedValue({}),
    deleteLog: jest.fn().mockResolvedValue({ success: true }),
    deleteProgram: jest.fn().mockResolvedValue({ success: true }),
  }
  const id = 'a62758e4-7e46-49de-8426-3a24857c5cfa'

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [
        { provide: SkillsService, useValue: service },
        { provide: AISkillGeneratorService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          context.switchToHttp().getRequest().user = { id: 'user-1' }
          return true
        },
      })
      .compile()
    app = moduleRef.createNestApplication()
    await app.init()
  })

  beforeEach(() => jest.clearAllMocks())
  afterAll(async () => app.close())

  it.each([
    ['get', '/skills/invalid'],
    ['get', '/skills/progress/step/invalid'],
    ['patch', '/skills/invalid'],
    ['patch', `/skills/invalid/steps/${id}`],
    ['patch', `/skills/${id}/steps/invalid`],
    ['delete', '/skills/invalid'],
    ['delete', '/skills/progress/invalid'],
  ] as const)('returns 400 for %s %s without calling a service', async (method, path) => {
    await request(app.getHttpServer())[method](path).send({}).expect(400)
    for (const handler of Object.values(service)) expect(handler).not.toHaveBeenCalled()
  })

  it('passes valid identifiers and authenticated ownership to the service', async () => {
    await request(app.getHttpServer()).patch(`/skills/${id}/steps/${id}`).send({ status: 'completed' }).expect(200)
    expect(service.updateStep).toHaveBeenCalledWith(id, id, 'user-1', { status: 'completed' })
  })
})
