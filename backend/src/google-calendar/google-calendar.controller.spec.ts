import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import type { Response } from 'express'
import { GoogleCalendarController } from './google-calendar.controller'
import { GoogleCalendarService } from './google-calendar.service'

const FRONTEND_URL = 'https://app.example.com'

describe('GoogleCalendarController — callback', () => {
  let controller: GoogleCalendarController
  let service: { handleCallback: jest.Mock }
  let res: { redirect: jest.Mock }

  beforeEach(async () => {
    service = { handleCallback: jest.fn().mockResolvedValue(undefined) }
    res = { redirect: jest.fn() }

    const moduleRef = await Test.createTestingModule({
      controllers: [GoogleCalendarController],
      providers: [
        { provide: GoogleCalendarService, useValue: service },
        { provide: ConfigService, useValue: { getOrThrow: () => FRONTEND_URL } },
      ],
    }).compile()

    controller = moduleRef.get(GoogleCalendarController)
  })

  const callback = (code?: string, state?: string, error?: string) =>
    controller.callback(code, state, error, res as unknown as Response)

  it('redirige vers le calendrier avec google_connected=true en cas de succès', async () => {
    await callback('code', 'state')

    expect(service.handleCallback).toHaveBeenCalledWith('code', 'state')
    expect(res.redirect).toHaveBeenCalledWith(`${FRONTEND_URL}/calendar?google_connected=true`)
  })

  it("redirige avec google_connected=false sans appeler Google quand l'utilisateur refuse", async () => {
    await callback(undefined, 'state', 'access_denied')

    expect(service.handleCallback).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith(`${FRONTEND_URL}/calendar?google_connected=false`)
  })

  it('redirige avec google_connected=false quand le code est absent', async () => {
    await callback(undefined, 'state')

    expect(service.handleCallback).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith(`${FRONTEND_URL}/calendar?google_connected=false`)
  })

  it('redirige avec google_connected=false au lieu de renvoyer une erreur quand le state est invalide', async () => {
    service.handleCallback.mockRejectedValue(new UnauthorizedException('State OAuth invalide ou expiré'))

    await callback('code', 'state-falsifie')

    expect(res.redirect).toHaveBeenCalledWith(`${FRONTEND_URL}/calendar?google_connected=false`)
  })
})
