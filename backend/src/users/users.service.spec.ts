import { NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { UserContextService } from 'src/user-context/user-context.service'
import { PUBLIC_USER_COLUMNS, UsersService } from './users.service'

function createKnexBuilderMock(terminal: { first?: unknown; returning?: unknown[] } = {}) {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereNotNull: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(terminal.first),
    returning: jest.fn().mockResolvedValue(terminal.returning ?? []),
  }
  return builder
}

const publicUser = { id: 'u1', email: 'dawie@mail.com', firstName: 'Dawie' }

describe('UsersService', () => {
  let userContextService: { invalidateCache: jest.Mock }

  async function buildService(knexMock: any): Promise<UsersService> {
    userContextService = { invalidateCache: jest.fn() }
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getConnectionToken(), useValue: knexMock },
        { provide: UserContextService, useValue: userContextService },
      ],
    }).compile()
    return moduleRef.get(UsersService)
  }

  describe('PUBLIC_USER_COLUMNS', () => {
    it.each(['password', 'google_refresh_token', 'google_calendar_id', 'medical_notes'])(
      "n'expose pas la colonne sensible %s",
      column => {
        expect(PUBLIC_USER_COLUMNS).not.toContain(column)
      }
    )
  })

  describe('getProfile', () => {
    it('ne lit que les colonnes publiques', async () => {
      // Arrange
      const userBuilder = createKnexBuilderMock({ first: publicUser })
      const statsBuilder = createKnexBuilderMock({ first: { count: 2, total_seconds: 600 } })
      const knexMock: any = jest.fn().mockReturnValueOnce(userBuilder).mockReturnValue(statsBuilder)
      knexMock.raw = jest.fn()
      const service = await buildService(knexMock)

      // Act
      const result = await service.getProfile('u1')

      // Assert
      expect(knexMock).toHaveBeenNthCalledWith(1, 'users')
      expect(userBuilder.first).toHaveBeenCalledWith(PUBLIC_USER_COLUMNS)
      expect(result).toEqual({ ...publicUser, stats: { workouts: 2, sessions: 2, total_time_minutes: 10 } })
    })

    it("lève une NotFoundException sans calculer les stats si l'utilisateur n'existe pas", async () => {
      // Arrange
      const userBuilder = createKnexBuilderMock({ first: undefined })
      const knexMock: any = jest.fn().mockReturnValue(userBuilder)
      const service = await buildService(knexMock)

      // Act & Assert
      await expect(service.getProfile('inconnu')).rejects.toThrow(NotFoundException)
      expect(knexMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('update', () => {
    it('persiste uniquement les champs modifies, serialise les JSON et restitue la date civile', async () => {
      const builder = createKnexBuilderMock({
        returning: [{ ...publicUser, dateOfBirth: new Date(1990, 5, 15), resting_heart_rate: 52 }],
      })
      const service = await buildService(jest.fn().mockReturnValue(builder))
      const preferences = {
        global_goals: { strength: true },
        training_preferences: { preferred_duration: 45, sessions_per_week: 3 },
        physical_limitations: ['Mobilite cheville'],
        schedule_preferences: { available_days: ['monday' as const] },
      }
      const result = await service.update('u1', {
        ...preferences,
        dateOfBirth: '1990-06-15',
        gender: 'female',
        resting_heart_rate: 52,
      })
      expect(builder.update).toHaveBeenCalledWith({
        dateOfBirth: '1990-06-15',
        gender: 'female',
        resting_heart_rate: 52,
        ...Object.fromEntries(Object.entries(preferences).map(([key, value]) => [key, JSON.stringify(value)])),
      })
      expect(result.dateOfBirth).toBe('1990-06-15')
      expect(result.resting_heart_rate).toBe(52)
      expect(userContextService.invalidateCache).toHaveBeenCalledWith('u1')
    })

    it('efface les nouveaux scalaires avec null et ne modifie pas les anciens JSON omis', async () => {
      const builder = createKnexBuilderMock({ returning: [{ ...publicUser, dateOfBirth: null }] })
      const service = await buildService(jest.fn().mockReturnValue(builder))
      const changes = { dateOfBirth: null, gender: null, resting_heart_rate: null }
      const result = await service.update('u1', changes)
      expect(builder.update).toHaveBeenCalledWith(changes)
      expect(result.dateOfBirth).toBeNull()
    })

    it('ne vide pas le cache quand la persistence echoue', async () => {
      const builder = createKnexBuilderMock()
      builder.returning.mockRejectedValue(new Error('database unavailable'))
      const service = await buildService(jest.fn().mockReturnValue(builder))
      await expect(service.update('u1', { resting_heart_rate: 52 })).rejects.toThrow('database unavailable')
      expect(userContextService.invalidateCache).not.toHaveBeenCalled()
    })

    it('ne renvoie que les colonnes publiques et invalide le cache IA', async () => {
      // Arrange
      const builder = createKnexBuilderMock({ returning: [publicUser] })
      const knexMock: any = jest.fn().mockReturnValue(builder)
      const service = await buildService(knexMock)

      // Act
      const result = await service.update('u1', { firstName: 'Dawie' })

      // Assert
      expect(builder.update).toHaveBeenCalledWith({ firstName: 'Dawie' })
      expect(builder.returning).toHaveBeenCalledWith(PUBLIC_USER_COLUMNS)
      expect(userContextService.invalidateCache).toHaveBeenCalledWith('u1')
      expect(result).toEqual(publicUser)
    })

    it('enregistre la FC max, référence des zones cardiaques des imports .fit', async () => {
      // Arrange
      const builder = createKnexBuilderMock({ returning: [publicUser] })
      const knexMock: any = jest.fn().mockReturnValue(builder)
      const service = await buildService(knexMock)

      // Act
      await service.update('u1', { max_heart_rate: 192 })

      // Assert
      expect(builder.update).toHaveBeenCalledWith({ max_heart_rate: 192 })
    })

    it("lève une NotFoundException sans invalider le cache si l'utilisateur n'existe pas", async () => {
      // Arrange
      const builder = createKnexBuilderMock({ returning: [] })
      const knexMock: any = jest.fn().mockReturnValue(builder)
      const service = await buildService(knexMock)

      // Act & Assert
      await expect(service.update('inconnu', { firstName: 'Dawie' })).rejects.toThrow(NotFoundException)
      expect(userContextService.invalidateCache).not.toHaveBeenCalled()
    })
  })
})
