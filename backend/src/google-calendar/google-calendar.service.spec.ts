import { BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { GOOGLE_CALENDAR_ENV_VARS, GoogleCalendarService } from './google-calendar.service'
import { GoogleOAuthStateService } from './google-oauth-state.service'

const FULL_CONFIG: Record<string, string> = {
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
  GOOGLE_REDIRECT_URI: 'https://app.example.com/api/calendar/google/callback',
}

describe('GoogleCalendarService', () => {
  let builder: { where: jest.Mock; update: jest.Mock; first: jest.Mock }
  let knexMock: jest.Mock
  let getToken: jest.Mock

  async function buildService(config: Record<string, string> = FULL_CONFIG): Promise<GoogleCalendarService> {
    builder = {
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue(1),
      first: jest.fn().mockResolvedValue(undefined),
    }
    knexMock = jest.fn().mockReturnValue(builder)
    getToken = jest.fn()

    const moduleRef = await Test.createTestingModule({
      providers: [
        GoogleCalendarService,
        { provide: getConnectionToken(), useValue: knexMock },
        { provide: GoogleOAuthStateService, useValue: { verify: () => 'user-1', create: () => 'signed-state' } },
        { provide: ConfigService, useValue: { get: (name: string) => config[name] } },
      ],
    }).compile()

    const service = moduleRef.get(GoogleCalendarService)
    // Aucun appel réseau vers Google pendant les tests
    jest.spyOn(service as any, 'getOAuth2Client').mockReturnValue({ getToken })
    return service
  }

  describe('handleCallback', () => {
    it("enregistre le refresh_token sur l'utilisateur du state", async () => {
      const service = await buildService()
      getToken.mockResolvedValue({ tokens: { refresh_token: 'refresh-token' } })

      await service.handleCallback('code', 'state')

      expect(getToken).toHaveBeenCalledWith('code')
      expect(builder.where).toHaveBeenCalledWith({ id: 'user-1' })
      expect(builder.update).toHaveBeenCalledWith({ google_refresh_token: 'refresh-token' })
    })

    it("n'enregistre rien et lève une erreur si Google ne renvoie pas de refresh_token", async () => {
      const service = await buildService()
      getToken.mockResolvedValue({ tokens: { access_token: 'access-token' } })

      await expect(service.handleCallback('code', 'state')).rejects.toThrow(BadRequestException)
      expect(knexMock).not.toHaveBeenCalled()
    })
  })

  describe('sans configuration Google complète', () => {
    it.each(GOOGLE_CALENDAR_ENV_VARS)('est indisponible si %s manque', async name => {
      const { [name]: _missing, ...partialConfig } = FULL_CONFIG
      const service = await buildService(partialConfig)

      expect(service.isAvailable()).toBe(false)
    })

    it("refuse de fournir une URL d'autorisation (503) au lieu d'envoyer vers une erreur Google", async () => {
      const service = await buildService({})

      expect(() => service.getAuthUrl('user-1')).toThrow(ServiceUnavailableException)
    })

    it('ne synchronise rien et ne lit pas la base', async () => {
      const service = await buildService({})

      await expect(service.syncWorkout('user-1', { name: 'Fran', scheduledDate: '2026-10-03' })).resolves.toBeNull()
      expect(knexMock).not.toHaveBeenCalled()
    })
  })

  it('est disponible quand les 3 variables sont définies', async () => {
    const service = await buildService()

    expect(service.isAvailable()).toBe(true)
  })
})
