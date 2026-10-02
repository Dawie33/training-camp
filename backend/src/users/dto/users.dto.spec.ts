import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common'
import { UpdateUserDto } from './users.dto'

// Mêmes options que le ValidationPipe global de main.ts
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  skipMissingProperties: false,
  transformOptions: { enableImplicitConversion: true },
})

const metadata: ArgumentMetadata = { type: 'body', metatype: UpdateUserDto }

function validate(body: Record<string, unknown>): Promise<UpdateUserDto> {
  return pipe.transform(body, metadata)
}

describe('UpdateUserDto (PATCH /users/me)', () => {
  it('accepte le formulaire du profil', async () => {
    const body = {
      firstName: 'Dawie',
      lastName: 'S',
      sport_level: 'intermediate',
      height: 180,
      weight: 75,
      body_fat_percentage: 14.5,
      equipment_available: ['barbell', 'rower'],
    }
    await expect(validate(body)).resolves.toEqual(expect.objectContaining(body))
  })

  it.each([
    ['role', { role: 'admin' }],
    ['isActive', { isActive: true }],
    ['email', { email: 'autre@mail.com' }],
  ])('rejette le champ %s, que seul le serveur peut modifier', async (_field, body) => {
    await expect(validate(body)).rejects.toThrow(BadRequestException)
  })

  it.each([
    ['un poids décimal (colonne entière)', { weight: 75.5 }],
    ['un poids hors bornes', { weight: 500 }],
    ['une taille hors bornes', { height: 90 }],
    ['un taux de masse grasse à 2 décimales', { body_fat_percentage: 14.25 }],
    ['un prénom vide', { firstName: '' }],
    ['un prénom de plus de 100 caractères', { firstName: 'a'.repeat(101) }],
    ['un équipement qui n\'est pas une chaîne', { equipment_available: [{ slug: 'barbell' }] }],
    ['plus de 100 équipements', { equipment_available: Array.from({ length: 101 }, (_, i) => `eq-${i}`) }],
  ])('rejette %s', async (_case, body) => {
    await expect(validate(body)).rejects.toThrow(BadRequestException)
  })
})
