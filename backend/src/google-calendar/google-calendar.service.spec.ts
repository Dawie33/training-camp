import { BadRequestException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { GoogleCalendarService } from './google-calendar.service'
import { GoogleOAuthStateService } from './google-oauth-state.service'

describe('GoogleCalendarService — handleCallback', () => {
  let service: GoogleCalendarService
  let builder: { where: jest.Mock; update: jest.Mock }
  let knexMock: jest.Mock
  let getToken: jest.Mock

  beforeEach(async () => {
    builder = { where: jest.fn().mockReturnThis(), update: jest.fn().mockResolvedValue(1) }
    knexMock = jest.fn().mockReturnValue(builder)
    getToken = jest.fn()

    const moduleRef = await Test.createTestingModule({
      providers: [
        GoogleCalendarService,
        { provide: getConnectionToken(), useValue: knexMock },
        { provide: GoogleOAuthStateService, useValue: { verify: () => 'user-1' } },
      ],
    }).compile()

    service = moduleRef.get(GoogleCalendarService)
    // Aucun appel réseau vers Google pendant les tests
    jest.spyOn(service as any, 'getOAuth2Client').mockReturnValue({ getToken })
  })

  it("enregistre le refresh_token sur l'utilisateur du state", async () => {
    getToken.mockResolvedValue({ tokens: { refresh_token: 'refresh-token' } })

    await service.handleCallback('code', 'state')

    expect(getToken).toHaveBeenCalledWith('code')
    expect(builder.where).toHaveBeenCalledWith({ id: 'user-1' })
    expect(builder.update).toHaveBeenCalledWith({ google_refresh_token: 'refresh-token' })
  })

  it("n'enregistre rien et lève une erreur si Google ne renvoie pas de refresh_token", async () => {
    getToken.mockResolvedValue({ tokens: { access_token: 'access-token' } })

    await expect(service.handleCallback('code', 'state')).rejects.toThrow(BadRequestException)
    expect(knexMock).not.toHaveBeenCalled()
  })
})
