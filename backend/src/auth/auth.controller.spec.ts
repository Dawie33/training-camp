import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { Test } from '@nestjs/testing'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'

const JWT_SECRET = 'secret-de-test'
const user = { id: 'user-1', email: 'dawie@mail.com', firstName: 'Dawie', lastName: 'Sy', role: 'user' }
const signupBody = { email: 'dawie@mail.com', password: 'secret123', firstName: 'Dawie', lastName: 'Sy' }
const loginBody = { email: 'dawie@mail.com', password: 'secret123' }

const authService = { signup: jest.fn(), login: jest.fn(), validateUser: jest.fn(), revokeTokens: jest.fn() }
const jwtService = new JwtService({ secret: JWT_SECRET })
const validToken = () => jwtService.sign({ sub: 'user-1', email: 'dawie@mail.com', ver: 0 }, { expiresIn: '7d' })

/** ConfigService réduit aux deux variables lues par le module auth. */
function fakeConfig(nodeEnv: string): Partial<ConfigService> {
  const values: Record<string, string> = { JWT_SECRET, NODE_ENV: nodeEnv }
  return { get: (key: string) => values[key], getOrThrow: (key: string) => values[key] }
}

/** Application de test : vraie JwtStrategy, vrai ValidationPipe et cookie-parser ; seuls AuthService et ConfigService sont simulés. */
async function createApp({ withThrottler = false, nodeEnv = 'development' } = {}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      PassportModule,
      ...(withThrottler ? [ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }])] : []),
    ],
    controllers: [AuthController],
    providers: [
      JwtStrategy,
      { provide: AuthService, useValue: authService },
      { provide: ConfigService, useValue: fakeConfig(nodeEnv) },
      ...(withThrottler ? [{ provide: APP_GUARD, useClass: ThrottlerGuard }] : []),
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  // Même configuration que main.ts
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: false,
      transformOptions: { enableImplicitConversion: true },
    })
  )
  app.use(cookieParser())
  await app.init()
  return app
}

function accessTokenCookie(res: request.Response): string {
  const cookies = (res.headers['set-cookie'] as unknown as string[] | undefined) ?? []
  return cookies.find(cookie => cookie.startsWith('access_token=')) ?? ''
}

beforeEach(() => {
  jest.resetAllMocks()
  authService.signup.mockResolvedValue({ access_token: 'signed-token', user })
  authService.login.mockResolvedValue({ access_token: 'signed-token', user })
  authService.validateUser.mockResolvedValue({ ...user, isActive: true })
  authService.revokeTokens.mockResolvedValue(undefined)
})

describe('AuthController', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('cookie access_token', () => {
    it("est posé au signup en httpOnly, SameSite=Lax, pour 7 jours, et le token n'est pas dans le body", async () => {
      const res = await request(app.getHttpServer()).post('/auth/signup').send(signupBody).expect(201)

      const cookie = accessTokenCookie(res)
      expect(cookie).toMatch(/^access_token=signed-token;/)
      expect(cookie).toContain('HttpOnly')
      expect(cookie).toContain('SameSite=Lax')
      expect(cookie).toContain('Path=/')
      expect(cookie).toContain(`Max-Age=${7 * 24 * 60 * 60}`)
      expect(res.body).toEqual({ user })
    })

    it("est posé au login, sans l'attribut Secure hors production", async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send(loginBody).expect(200)

      const cookie = accessTokenCookie(res)
      expect(cookie).toContain('HttpOnly')
      expect(cookie).not.toContain('Secure')
    })

    it("porte l'attribut Secure en production", async () => {
      // NODE_ENV est lu une fois, à la construction du contrôleur : il faut une application dédiée
      const productionApp = await createApp({ nodeEnv: 'production' })

      try {
        const res = await request(productionApp.getHttpServer()).post('/auth/login').send(loginBody).expect(200)

        expect(accessTokenCookie(res)).toContain('Secure')
      } finally {
        await productionApp.close()
      }
    })

    it("n'est pas posé quand la connexion échoue", async () => {
      authService.login.mockRejectedValue(new UnauthorizedException('Les données de connexion sont invalides'))

      const res = await request(app.getHttpServer()).post('/auth/login').send(loginBody).expect(401)

      expect(accessTokenCookie(res)).toBe('')
    })
  })

  describe('validation des données', () => {
    it("normalise l'email (espaces, majuscules) avant de le transmettre au service", async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ ...signupBody, email: '  Dawie@Mail.COM ' })
        .expect(201)

      expect(authService.signup).toHaveBeenCalledWith(expect.objectContaining({ email: 'dawie@mail.com' }))
    })

    it("refuse un champ inconnu (400), par exemple un role choisi à l'inscription", async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ ...signupBody, role: 'admin' })
        .expect(400)

      expect(authService.signup).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('efface le cookie avec les mêmes options', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `access_token=${validToken()}`)
        .expect(200)

      const cookie = accessTokenCookie(res)
      expect(cookie).toMatch(/^access_token=;/)
      expect(cookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')
      expect(cookie).toContain('HttpOnly')
      expect(cookie).toContain('SameSite=Lax')
      expect(cookie).toContain('Path=/')
    })

    it("révoque les jetons de l'utilisateur connecté", async () => {
      await request(app.getHttpServer()).post('/auth/logout').set('Cookie', `access_token=${validToken()}`).expect(200)

      expect(authService.revokeTokens).toHaveBeenCalledWith('user-1')
    })

    it('exige une session (401)', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401)

      expect(authService.revokeTokens).not.toHaveBeenCalled()
    })

    it('refuse après la déconnexion un jeton émis avant, même copié ailleurs (401)', async () => {
      // Version des jetons simulée en mémoire, comme la colonne users.token_version
      let tokenVersion = 0
      authService.validateUser.mockImplementation(async (_userId: string, ver: unknown) =>
        ver === tokenVersion ? { ...user, isActive: true } : null
      )
      authService.revokeTokens.mockImplementation(async () => {
        tokenVersion += 1
      })
      const stolenToken = validToken()

      await request(app.getHttpServer()).get('/auth/me').set('Cookie', `access_token=${stolenToken}`).expect(200)
      await request(app.getHttpServer()).post('/auth/logout').set('Cookie', `access_token=${stolenToken}`).expect(200)
      await request(app.getHttpServer()).get('/auth/me').set('Cookie', `access_token=${stolenToken}`).expect(401)
      await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${stolenToken}`).expect(401)
    })
  })

  describe('JwtStrategy (via GET /auth/me)', () => {
    const me = () => request(app.getHttpServer()).get('/auth/me')

    it("accepte le token du cookie et renvoie l'utilisateur validé", async () => {
      const res = await me().set('Cookie', `access_token=${validToken()}`).expect(200)

      expect(authService.validateUser).toHaveBeenCalledWith('user-1', 0)
      expect(res.body).toEqual({ ...user, isActive: true })
    })

    it('accepte le token du header Authorization Bearer', async () => {
      await me().set('Authorization', `Bearer ${validToken()}`).expect(200)
    })

    it('lit le cookie en priorité sur le header Bearer', async () => {
      await me().set('Cookie', 'access_token=pas-un-jwt').set('Authorization', `Bearer ${validToken()}`).expect(401)
    })

    it('refuse une requête sans token (401)', async () => {
      await me().expect(401)
    })

    it('refuse un token expiré (401)', async () => {
      const expiredToken = jwtService.sign({
        sub: 'user-1',
        email: 'dawie@mail.com',
        exp: Math.floor(Date.now() / 1000) - 60,
      })

      await me().set('Cookie', `access_token=${expiredToken}`).expect(401)
    })

    it('refuse un token signé avec une autre clé (401)', async () => {
      const forgedToken = new JwtService({ secret: 'autre-secret' }).sign({ sub: 'user-1', email: 'dawie@mail.com' })

      await me().set('Cookie', `access_token=${forgedToken}`).expect(401)
    })

    it('refuse un compte désactivé ou supprimé depuis la création du token (401)', async () => {
      authService.validateUser.mockResolvedValue(null)

      await me().set('Cookie', `access_token=${validToken()}`).expect(401)
    })
  })
})

describe('AuthController — limitation du nombre de requêtes', () => {
  let app: INestApplication

  // Une application par test : chacune a son propre compteur de requêtes
  beforeEach(async () => {
    app = await createApp({ withThrottler: true })
  })

  afterEach(async () => {
    await app.close()
  })

  it('bloque le 6e signup dans la minute (429)', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer()).post('/auth/signup').send(signupBody).expect(201)
    }
    await request(app.getHttpServer()).post('/auth/signup').send(signupBody).expect(429)
  })

  it('bloque le 11e login dans la minute (429)', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer()).post('/auth/login').send(loginBody).expect(200)
    }
    await request(app.getHttpServer()).post('/auth/login').send(loginBody).expect(429)
  })
})
