import { Controller, Delete, Get, Logger, Query, Req, Res, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Response } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

import { GoogleCalendarService } from './google-calendar.service'

/** Codes d'erreur OAuth (ex. access_denied) : le paramètre vient de l'URL, on ne logue rien d'autre. */
const OAUTH_ERROR_CODE = /^[a-z_]{1,50}$/

@Controller('calendar/google')
export class GoogleCalendarController {
  private readonly logger = new Logger(GoogleCalendarController.name)

  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly config: ConfigService
  ) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@Req() req) {
    const url = this.googleCalendarService.getAuthUrl(req.user.id)
    return { url }
  }

  /**
   * Retour de Google après l'écran de consentement. C'est le navigateur de l'utilisateur qui arrive
   * ici : on le renvoie toujours vers le calendrier, jamais vers une page d'erreur JSON.
   */
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response
  ): Promise<void> {
    const calendarUrl = `${this.config.getOrThrow<string>('FRONTEND_URL')}/calendar`

    // error=access_denied : l'utilisateur a cliqué « Annuler » chez Google
    if (error || !code) {
      const reason = error && OAUTH_ERROR_CODE.test(error) ? error : 'paramètres invalides'
      this.logger.warn(`Connexion Google annulée ou incomplète : ${reason}`)
      return res.redirect(`${calendarUrl}?google_connected=false`)
    }

    try {
      await this.googleCalendarService.handleCallback(code, state)
      return res.redirect(`${calendarUrl}?google_connected=true`)
    } catch (err) {
      // Le message ne contient ni le code ni le token
      this.logger.error(`Échec de la connexion Google : ${(err as Error).message}`)
      return res.redirect(`${calendarUrl}?google_connected=false`)
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async status(@Req() req) {
    const connected = await this.googleCalendarService.isConnected(req.user.id)
    return { connected }
  }

  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  async disconnect(@Req() req) {
    await this.googleCalendarService.disconnect(req.user.id)
    return { success: true }
  }
}
