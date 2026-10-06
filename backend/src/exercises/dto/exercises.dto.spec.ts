import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common'
import { ExerciseQueryDto } from './exercises.dto'

// Mêmes options que le ValidationPipe global de main.ts
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  skipMissingProperties: false,
  transformOptions: { enableImplicitConversion: true },
})

const metadata: ArgumentMetadata = { type: 'query', metatype: ExerciseQueryDto }

// Les paramètres d'URL arrivent toujours en texte
const validate = (query: Record<string, string>): Promise<ExerciseQueryDto> => pipe.transform(query, metadata)

describe('ExerciseQueryDto (GET /exercises)', () => {
  it("accepte limit=500, demandé par l'éditeur de workout, et le convertit en nombre", async () => {
    await expect(validate({ limit: '500', offset: '0' })).resolves.toEqual(
      expect.objectContaining({ limit: 500, offset: 0 })
    )
  })

  it('accepte les filtres et un tri autorisé', async () => {
    await expect(
      validate({ category: 'gymnastics', difficulty: 'beginner', bodyweight_only: 'true', orderBy: 'name' })
    ).resolves.toEqual(
      expect.objectContaining({
        category: 'gymnastics',
        difficulty: 'beginner',
        bodyweight_only: true,
        orderBy: 'name',
      })
    )
  })

  it.each([
    ['un limit au-delà de 500', { limit: '501' }],
    ['un limit non numérique', { limit: 'abc' }],
    ['un offset négatif', { offset: '-1' }],
    ['une colonne de tri inconnue', { orderBy: 'password' }],
    ['un sens de tri inconnu', { orderDir: 'up' }],
    ['une catégorie inconnue', { category: 'yoga' }],
    ['une recherche de plus de 100 caractères', { search: 'a'.repeat(101) }],
  ])('rejette %s', async (_case, query) => {
    await expect(validate(query)).rejects.toThrow(BadRequestException)
  })
})
