import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common'
import { EquipmentQueryDto } from './equipments.dto'

// Mêmes options que le ValidationPipe global de main.ts
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  skipMissingProperties: false,
  transformOptions: { enableImplicitConversion: true },
})

const metadata: ArgumentMetadata = { type: 'query', metatype: EquipmentQueryDto }

// Les paramètres d'URL arrivent toujours en texte
const validate = (query: Record<string, string>): Promise<EquipmentQueryDto> => pipe.transform(query, metadata)

describe('EquipmentQueryDto (GET /equipments)', () => {
  it('convertit limit et offset en nombres, comme les envoie la page de création de compétence', async () => {
    await expect(validate({ limit: '100', offset: '0' })).resolves.toEqual(
      expect.objectContaining({ limit: 100, offset: 0 })
    )
  })

  it('accepte un tri sur une colonne autorisée', async () => {
    await expect(validate({ orderBy: 'label', orderDir: 'asc' })).resolves.toEqual(
      expect.objectContaining({ orderBy: 'label', orderDir: 'asc' })
    )
  })

  it.each([
    ['un limit au-delà de 100', { limit: '500' }],
    ['un limit non numérique', { limit: 'abc' }],
    ['un offset négatif', { offset: '-1' }],
    ['une colonne de tri inconnue', { orderBy: 'prix' }],
    ['un sens de tri inconnu', { orderDir: 'up' }],
    ['une recherche de plus de 100 caractères', { search: 'a'.repeat(101) }],
  ])('rejette %s', async (_case, query) => {
    await expect(validate(query)).rejects.toThrow(BadRequestException)
  })
})
