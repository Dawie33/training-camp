import { Global, Module, UnauthorizedException } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { GoogleCalendarModule } from './google-calendar.module'
import { GoogleCalendarService } from './google-calendar.service'
import { GoogleOAuthStateService, oauthStateJwtOptions } from './google-oauth-state.service'

const JWT_SECRET = 'x'.repeat(64)
const VICTIM_ID = 'victim-id'
const ATTACKER_ID = 'attacker-id'

// Knex n'est jamais appelé dans ces tests : un state invalide est rejeté avant tout accès à la base
const knexMock = jest.fn()

@Global()
@Module({ providers: [{ provide: getConnectionToken(), useValue: knexMock }], exports: [getConnectionToken()] })
class FakeKnexModule {}

function stateFromAuthUrl(url: string): string {
  return new URL(url).searchParams.get('state') ?? ''
}

describe('GoogleOAuthStateService', () => {
  let stateService: GoogleOAuthStateService
  let calendarService: GoogleCalendarService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET,
              GOOGLE_CLIENT_ID: 'client-id',
              GOOGLE_CLIENT_SECRET: 'client-secret',
              GOOGLE_REDIRECT_URI: 'https://app.example.com/api/calendar/google/callback',
            }),
          ],
        }),
        FakeKnexModule,
        GoogleCalendarModule,
      ],
    }).compile()

    stateService = moduleRef.get(GoogleOAuthStateService)
    calendarService = moduleRef.get(GoogleCalendarService)
  })

  it("met dans l'URL Google un state signé, et non l'id en clair", () => {
    const state = stateFromAuthUrl(calendarService.getAuthUrl(ATTACKER_ID))

    expect(state).not.toBe(ATTACKER_ID)
    expect(stateService.verify(state)).toBe(ATTACKER_ID)
  })

  it("rejette un state dont l'id a été remplacé par celui d'une victime", async () => {
    // L'attaquant décode son state, remplace son id par celui de la victime et recolle le JWT
    const [header, payload, signature] = stateFromAuthUrl(calendarService.getAuthUrl(ATTACKER_ID)).split('.')
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), sub: VICTIM_ID })
    ).toString('base64url')

    await expect(calendarService.handleCallback('code', `${header}.${forgedPayload}.${signature}`)).rejects.toThrow(
      UnauthorizedException
    )
    expect(knexMock).not.toHaveBeenCalled()
  })

  it("rejette l'ancien format : l'id de l'utilisateur en clair", () => {
    expect(() => stateService.verify(VICTIM_ID)).toThrow(UnauthorizedException)
  })

  it('rejette un state absent', () => {
    expect(() => stateService.verify(undefined)).toThrow(UnauthorizedException)
  })

  it('rejette un state expiré', () => {
    const signer = new JwtService({ secret: oauthStateJwtOptions(JWT_SECRET).secret })
    const expired = signer.sign({ sub: VICTIM_ID, purpose: 'google-oauth', exp: Math.floor(Date.now() / 1000) - 60 })

    expect(() => stateService.verify(expired)).toThrow(UnauthorizedException)
  })

  it('rejette un jeton de connexion utilisé comme state', () => {
    const accessToken = new JwtService({ secret: JWT_SECRET }).sign({ sub: VICTIM_ID, email: 'v@mail.com' })

    expect(() => stateService.verify(accessToken)).toThrow(UnauthorizedException)
  })

  it("n'est pas accepté comme jeton de connexion (clé distincte de JWT_SECRET)", () => {
    const state = stateService.create(VICTIM_ID)

    expect(() => new JwtService({ secret: JWT_SECRET }).verify(state)).toThrow()
  })
})
