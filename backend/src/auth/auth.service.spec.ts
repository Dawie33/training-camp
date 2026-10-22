import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import * as bcrypt from 'bcryptjs'
import { getConnectionToken } from 'nest-knexjs'
import { AuthService, BCRYPT_COST } from './auth.service'

const storedUser = {
  id: 'user-1',
  email: 'dawie@mail.com',
  firstName: 'Dawie',
  lastName: 'Sy',
  role: 'user',
  isActive: true,
}

describe('AuthService', () => {
  let builder: Record<string, jest.Mock>
  let sign: jest.Mock
  let service: AuthService

  beforeEach(async () => {
    builder = {
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(undefined),
      returning: jest.fn().mockResolvedValue([storedUser]),
      update: jest.fn().mockResolvedValue(1),
    }
    // knex('users') renvoie toujours le même builder : chaque méthode terminale ne sert qu'une fois par scénario
    const knexMock: any = jest.fn(() => builder)
    knexMock.fn = { now: () => 'NOW()' }
    sign = jest.fn().mockReturnValue('signed-token')

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getConnectionToken(), useValue: knexMock },
        { provide: JwtService, useValue: { sign } },
      ],
    }).compile()
    service = moduleRef.get(AuthService)
  })

  describe('signup', () => {
    const signupDto = { email: 'dawie@mail.com', password: 'secret123', firstName: 'Dawie', lastName: 'Sy' }

    it('refuse un email déjà inscrit (409), sans créer de compte', async () => {
      builder.first.mockResolvedValue(storedUser)

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException)
      expect(builder.insert).not.toHaveBeenCalled()
    })

    it("renvoie 409 si une inscription simultanée prend l'email entre la vérification et l'insertion", async () => {
      builder.returning.mockRejectedValue({ code: '23505', constraint: 'users_email_unique' })

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException)
    })

    it('propage les autres erreurs de base de données', async () => {
      builder.returning.mockRejectedValue(new Error('connexion perdue'))

      await expect(service.signup(signupDto)).rejects.toThrow('connexion perdue')
    })

    it('stocke le mot de passe hashé, jamais en clair', async () => {
      await service.signup(signupDto)

      const { password } = builder.insert.mock.calls[0][0]
      expect(password).not.toBe('secret123')
      expect(await bcrypt.compare('secret123', password)).toBe(true)
      expect(bcrypt.getRounds(password)).toBe(BCRYPT_COST)
    })

    it("renvoie un token signé avec l'id et l'email, et l'utilisateur créé", async () => {
      const result = await service.signup(signupDto)

      expect(sign).toHaveBeenCalledWith({ sub: 'user-1', email: 'dawie@mail.com' })
      expect(result).toEqual({
        access_token: 'signed-token',
        user: { id: 'user-1', email: 'dawie@mail.com', firstName: 'Dawie', lastName: 'Sy', role: 'user' },
      })
    })
  })

  describe('login', () => {
    let passwordHash: string

    beforeAll(async () => {
      // Coût réduit : seul le hash compte ici, pas sa robustesse
      passwordHash = await bcrypt.hash('secret123', 4)
    })

    it('répond pareil à un email inconnu et à un mauvais mot de passe (pas de fuite des comptes existants)', async () => {
      builder.first.mockResolvedValue(undefined)
      const unknownEmailError = await service
        .login({ email: 'inconnu@mail.com', password: 'secret123' })
        .catch((error: unknown) => error)

      builder.first.mockResolvedValue({ ...storedUser, password: passwordHash })
      const wrongPasswordError = await service
        .login({ email: 'dawie@mail.com', password: 'mauvais-mdp' })
        .catch((error: unknown) => error)

      expect(unknownEmailError).toBeInstanceOf(UnauthorizedException)
      expect(wrongPasswordError).toEqual(unknownEmailError)
      expect(builder.update).not.toHaveBeenCalled()
      expect(sign).not.toHaveBeenCalled()
    })

    it('met à jour lastLoginAt et renvoie un token, sans le hash du mot de passe', async () => {
      builder.first.mockResolvedValue({ ...storedUser, password: passwordHash })

      const result = await service.login({ email: 'dawie@mail.com', password: 'secret123' })

      expect(builder.where).toHaveBeenCalledWith({ id: 'user-1' })
      expect(builder.update).toHaveBeenCalledWith({ lastLoginAt: 'NOW()' })
      expect(sign).toHaveBeenCalledWith({ sub: 'user-1', email: 'dawie@mail.com' })
      expect(result.access_token).toBe('signed-token')
      expect(result.user).not.toHaveProperty('password')
    })
  })

  describe('validateUser', () => {
    it('renvoie null pour un utilisateur inexistant', async () => {
      builder.first.mockResolvedValue(undefined)

      expect(await service.validateUser('user-1')).toBeNull()
    })

    it('renvoie null pour un compte désactivé', async () => {
      builder.first.mockResolvedValue({ ...storedUser, isActive: false })

      expect(await service.validateUser('user-1')).toBeNull()
    })

    it("renvoie l'utilisateur actif, sans lire le mot de passe", async () => {
      builder.first.mockResolvedValue(storedUser)

      expect(await service.validateUser('user-1')).toEqual(storedUser)
      expect(builder.first).toHaveBeenCalledWith(['id', 'email', 'firstName', 'lastName', 'role', 'isActive'])
    })
  })
})
