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

  describe('injuries', () => {
    const injury = {
      zone: 'shoulder',
      side: 'right',
      status: 'active',
      severity: 'moderate',
      painful_patterns: ['overhead', 'kipping'],
      since: '2026-09',
      notes: 'Douleur sur le jerk',
    }

    it('accepte une liste de blessures valides, et une liste vide', async () => {
      await expect(validate({ injuries: [injury] })).resolves.toEqual(
        expect.objectContaining({ injuries: [expect.objectContaining(injury)] })
      )
      await expect(validate({ injuries: [] })).resolves.toEqual(expect.objectContaining({ injuries: [] }))
    })

    it.each([
      ['une zone inconnue', { ...injury, zone: 'tete' }],
      ['un statut inconnu', { ...injury, status: 'gueri' }],
      ['une famille de mouvements inconnue', { ...injury, painful_patterns: ['burpee'] }],
      ['une famille en double', { ...injury, painful_patterns: ['overhead', 'overhead'] }],
      ['une date au mauvais format', { ...injury, since: '09/2026' }],
      ['une note de plus de 300 caractères', { ...injury, notes: 'a'.repeat(301) }],
      ['un champ inconnu dans la blessure', { ...injury, diagnostic: 'tendinite' }],
      ['un champ obligatoire manquant', { zone: 'knee', side: 'left', status: 'past', painful_patterns: [] }],
    ])('rejette %s', async (_case, invalidInjury) => {
      await expect(validate({ injuries: [invalidInjury] })).rejects.toThrow(BadRequestException)
    })

    it('rejette plus de 20 blessures', async () => {
      await expect(validate({ injuries: Array.from({ length: 21 }, () => injury) })).rejects.toThrow(
        BadRequestException
      )
    })
  })
})
