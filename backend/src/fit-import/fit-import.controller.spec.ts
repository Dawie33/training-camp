import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { FIT_MAX_FILE_SIZE, FitImportController } from './fit-import.controller'
import { FitImportService } from './fit-import.service'

describe('FitImportController — POST /fit-import/parse-multiple', () => {
  let app: INestApplication
  const parseMultipleFitFiles = jest.fn().mockResolvedValue({ activities: [], totals: {} })

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FitImportController],
      providers: [{ provide: FitImportService, useValue: { parseMultipleFitFiles } }],
    })
      // Utilisateur connecté : on teste la réception des fichiers, pas l'authentification
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  beforeEach(() => parseMultipleFitFiles.mockClear())

  afterAll(async () => {
    await app.close()
  })

  const upload = () => request(app.getHttpServer()).post('/fit-import/parse-multiple')

  it('transmet les fichiers .fit au service', async () => {
    await upload().attach('files', Buffer.from('contenu'), 'seance.fit').expect(201)

    expect(parseMultipleFitFiles).toHaveBeenCalledWith([Buffer.from('contenu')])
  })

  it('refuse un fichier de plus de 5 Mo (413), sans le transmettre au service', async () => {
    await upload()
      .attach('files', Buffer.alloc(FIT_MAX_FILE_SIZE + 1), 'enorme.fit')
      .expect(413)
    expect(parseMultipleFitFiles).not.toHaveBeenCalled()
  })

  it("refuse un fichier dont l'extension n'est pas .fit", async () => {
    await upload().attach('files', Buffer.from('contenu'), 'seance.gpx').expect(400)
    expect(parseMultipleFitFiles).not.toHaveBeenCalled()
  })

  it('refuse un envoi sans fichier', async () => {
    await upload().expect(400)
  })

  it("n'expose plus la route à fichier unique /parse, qu'aucun écran n'utilisait", async () => {
    await request(app.getHttpServer())
      .post('/fit-import/parse')
      .attach('file', Buffer.from('contenu'), 'seance.fit')
      .expect(404)
  })
})
