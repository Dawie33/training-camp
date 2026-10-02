import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { UserContextService } from 'src/workouts/services/user-context.service'
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
      (column) => {
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

    it("renvoie null sans calculer les stats si l'utilisateur n'existe pas", async () => {
      // Arrange
      const userBuilder = createKnexBuilderMock({ first: undefined })
      const knexMock: any = jest.fn().mockReturnValue(userBuilder)
      const service = await buildService(knexMock)

      // Act
      const result = await service.getProfile('inconnu')

      // Assert
      expect(result).toBeNull()
      expect(knexMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('update', () => {
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
  })
})
