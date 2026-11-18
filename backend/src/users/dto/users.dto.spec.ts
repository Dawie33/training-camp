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
  it('valide les preferences structurees et permet leur effacement explicite', async () => {
    const body = {
      dateOfBirth: '1990-06-15',
      gender: 'other',
      resting_heart_rate: 52,
      global_goals: { strength: true, weight_loss: false },
      training_preferences: { preferred_duration: 60, sessions_per_week: 4 },
      physical_limitations: ['Amplitude de cheville limitee sans douleur'],
      schedule_preferences: { available_days: ['monday', 'friday'] },
    }
    await expect(validate(body)).resolves.toEqual(expect.objectContaining(body))
    const cleared = {
      dateOfBirth: null,
      gender: null,
      resting_heart_rate: null,
      global_goals: {},
      training_preferences: {},
      physical_limitations: [],
      schedule_preferences: {},
    }
    await expect(validate(cleared)).resolves.toEqual(expect.objectContaining(cleared))
  })

  it.each([
    { dateOfBirth: '2999-01-01' },
    { dateOfBirth: '2024-02-30' },
    { dateOfBirth: '1990-06-15T00:00:00Z' },
    { dateOfBirth: '1899-12-31' },
    { gender: 'unknown' },
    { resting_heart_rate: 29 },
    { resting_heart_rate: 121 },
    { resting_heart_rate: 55.5 },
    { global_goals: { strength: 'false' } },
    { global_goals: { unknown: true } },
    { global_goals: [] },
    { global_goals: null },
    { training_preferences: { preferred_duration: '60' } },
    { training_preferences: { preferred_duration: 19 } },
    { training_preferences: { preferred_duration: 91 } },
    { training_preferences: { sessions_per_week: 1.5 } },
    { training_preferences: { sessions_per_week: 8 } },
    { training_preferences: { intensity: 'high' } },
    { training_preferences: null },
    { physical_limitations: { notes: 'douleur' } },
    { physical_limitations: [' '] },
    { physical_limitations: ['a'.repeat(301)] },
    { physical_limitations: [' '.repeat(301) + 'restriction'] },
    { physical_limitations: Array(11).fill('limitation') },
    { physical_limitations: null },
    { schedule_preferences: { available_days: ['monday', 'monday'] } },
    { schedule_preferences: { available_days: ['lundi'] } },
    { schedule_preferences: { available_days: 'monday' } },
    { schedule_preferences: { hour: '10:00' } },
    { schedule_preferences: null },
  ])('rejette un nouveau champ mal forme : %j', async body => {
    await expect(validate(body)).rejects.toThrow(BadRequestException)
  })

  it('accepte le formulaire du profil', async () => {
    const body = {
      firstName: 'Dawie',
      lastName: 'S',
      sport_level: 'intermediate',
      height: 180,
      weight: 75,
      body_fat_percentage: 14.5,
      max_heart_rate: 192,
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
    ['une FC max décimale (colonne entière)', { max_heart_rate: 190.5 }],
    ['une FC max trop basse pour un adulte', { max_heart_rate: 90 }],
    ['une FC max trop haute pour un adulte', { max_heart_rate: 240 }],
    ['un prénom vide', { firstName: '' }],
    ['un prénom de plus de 100 caractères', { firstName: 'a'.repeat(101) }],
    ["un équipement qui n'est pas une chaîne", { equipment_available: [{ slug: 'barbell' }] }],
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
