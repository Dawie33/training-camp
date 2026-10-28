import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common'
import { OverviewQueryDto } from './overview-query.dto'

// Mêmes options que le ValidationPipe global de main.ts
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  skipMissingProperties: false,
  transformOptions: { enableImplicitConversion: true },
})

const metadata: ArgumentMetadata = { type: 'query', metatype: OverviewQueryDto }

// Les paramètres d'URL arrivent toujours en texte
const validate = (query: Record<string, string>): Promise<OverviewQueryDto> => pipe.transform(query, metadata)

describe('OverviewQueryDto (GET /analytics/overview)', () => {
  it("convertit months en nombre, comme l'envoie le filtre de période du tableau de bord", async () => {
    await expect(validate({ months: '6' })).resolves.toEqual(expect.objectContaining({ months: 6 }))
  })

  it('applique 3 mois quand la période est absente', async () => {
    await expect(validate({})).resolves.toEqual(expect.objectContaining({ months: 3 }))
  })

  it.each([
    ['une période décimale', { months: '1.5' }],
    ['une période au-delà de 12 mois', { months: '20' }],
    ['une période nulle', { months: '0' }],
    ['une période non numérique', { months: 'abc' }],
    ['un paramètre inconnu', { months: '3', sport: 'crossfit' }],
  ])('rejette %s', async (_case, query) => {
    await expect(validate(query)).rejects.toThrow(BadRequestException)
  })
})
