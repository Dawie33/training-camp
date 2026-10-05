import { BadRequestException, Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { google } from 'googleapis'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { buildEventTimes } from './calendar-event-time'
import { GoogleOAuthStateService } from './google-oauth-state.service'

/**
 * Google répond `invalid_grant` quand le refresh_token a été révoqué (l'utilisateur a retiré l'accès
 * depuis son compte Google) ou a expiré : il ne fonctionnera plus jamais.
 */
export function isRevokedTokenError(error: unknown): boolean {
  const body = (error as { response?: { data?: { error?: unknown } } } | null)?.response?.data
  return body?.error === 'invalid_grant' || (error instanceof Error && error.message.includes('invalid_grant'))
}

/**
 * Seul droit demandé : gérer les événements. Le scope `auth/calendar` donnerait aussi la lecture,
 * la modification, la suppression et le partage de tous les agendas de l'utilisateur.
 * À garder identique au scope déclaré sur l'écran de consentement de la console Google Cloud.
 */
export const GOOGLE_CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events']

/** Sans l'une de ces variables, Google rejette la demande d'autorisation : la fonctionnalité est désactivée. */
export const GOOGLE_CALENDAR_ENV_VARS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'] as const

@Injectable()
export class GoogleCalendarService implements OnModuleInit {
  private readonly logger = new Logger(GoogleCalendarService.name)

  constructor(
    @InjectModel() private readonly knex: Knex,
    private readonly oauthState: GoogleOAuthStateService,
    private readonly config: ConfigService
  ) {}

  onModuleInit(): void {
    const missing = this.missingEnvVars()
    if (missing.length > 0) {
      this.logger.warn(`Google Calendar désactivé : ${missing.join(', ')} non définie(s)`)
    }
  }

  private missingEnvVars(): string[] {
    return GOOGLE_CALENDAR_ENV_VARS.filter(name => !this.config.get<string>(name))
  }

  /** La synchronisation Google Agenda est-elle configurée sur ce serveur ? */
  isAvailable(): boolean {
    return this.missingEnvVars().length === 0
  }

  private assertAvailable(): void {
    if (!this.isAvailable()) {
      throw new ServiceUnavailableException("La synchronisation Google Agenda n'est pas configurée")
    }
  }

  /**
   * Renvoie une nouvelle instance de client OAuth2 configurée avec les
   * identifiants Google OAuth2 de l'application.
   * @returns {google.auth.OAuth2} Une nouvelle instance de client OAuth2.
   */
  private getOAuth2Client() {
    return new google.auth.OAuth2(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
      this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      this.config.get<string>('GOOGLE_REDIRECT_URI')
    )
  }

  /**
   * Renvoie une URL d'autorisation que l'utilisateur peut utiliser pour autoriser l'application
   * à accéder à son agenda Google.
   * @param {string} userId L'identifiant de l'utilisateur.
   * @returns {string} L'URL d'autorisation.
   * @throws {ServiceUnavailableException} Si la fonctionnalité n'est pas configurée.
   */
  getAuthUrl(userId: string): string {
    this.assertAvailable()
    const oauth2Client = this.getOAuth2Client()
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GOOGLE_CALENDAR_SCOPES,
      state: this.oauthState.create(userId),
    })
  }

  /**
   * Gère le rappel d'autorisation de Google OAuth2.
   * @param {string} code Le code d'autorisation.
   * @param {string} state Le state signé créé par getAuthUrl, qui porte l'id de l'utilisateur.
   * @returns {Promise<void>} Une promesse résolue lorsque le jeton d'actualisation Google de l'utilisateur est mis à jour.
   * @throws {UnauthorizedException} Si le state est invalide ou expiré.
   * @throws {BadRequestException} Si Google ne renvoie pas de refresh_token.
   */
  async handleCallback(code: string, state: string | undefined): Promise<void> {
    // Vérifié avant tout appel à Google : un state falsifié n'atteint jamais la base
    const userId = this.oauthState.verify(state)
    this.assertAvailable()
    const oauth2Client = this.getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)

    // Sans refresh_token, aucune synchronisation possible : on ne marque pas l'utilisateur comme connecté
    if (!tokens.refresh_token) {
      throw new BadRequestException("Google n'a pas renvoyé de refresh_token")
    }

    await this.knex('users').where({ id: userId }).update({ google_refresh_token: tokens.refresh_token })
  }

  /**
   * Synchronise une séance d'entraînement avec Google Agenda.
   * @param userId L'identifiant de l'utilisateur.
   * @param workout La séance d'entraînement à synchroniser.
   * @returns L'identifiant de l'événement créé en cas de succès, null sinon.
   */
  async syncWorkout(
    userId: string,
    workout: {
      name: string
      scheduledDate: string
      duration?: number
      type?: string
    }
  ): Promise<string | null> {
    if (!this.isAvailable()) return null

    const refreshToken = await this.findRefreshToken(userId)
    if (!refreshToken) return null

    const oauth2Client = this.getOAuth2Client()
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // La planification ne doit jamais échouer à cause de Google : on gère l'erreur ici et on renvoie null
    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: `🏋️ ${workout.name}`,
          description: workout.type ? `Type: ${workout.type.replace(/_/g, ' ')}` : undefined,
          ...buildEventTimes(workout.scheduledDate, workout.duration),
          colorId: '11',
        },
      })
      return response.data.id ?? null
    } catch (error) {
      if (isRevokedTokenError(error)) {
        // Token définitivement inutilisable : on déconnecte pour que l'utilisateur puisse se reconnecter
        this.logger.warn(`Accès Google révoqué pour l'utilisateur ${userId} : token effacé`)
        await this.clearRefreshToken(userId)
      } else {
        // Panne ou quota Google, sans doute temporaire : on garde la connexion
        this.logger.error(
          `Échec de la synchronisation Google pour l'utilisateur ${userId} : ${(error as Error).message}`
        )
      }
      return null
    }
  }

  /** Ne lit que la colonne utile : inutile de charger le reste de la ligne users (hash du mot de passe compris). */
  private async findRefreshToken(userId: string): Promise<string | null> {
    const row = await this.knex('users').where({ id: userId }).first('google_refresh_token')
    return row?.google_refresh_token ?? null
  }

  private async clearRefreshToken(userId: string): Promise<void> {
    await this.knex('users').where({ id: userId }).update({ google_refresh_token: null })
  }

  /**
   * Vérifie si l'utilisateur est connecté à Google Calendar.
   * @param userId ID de l'utilisateur
   * @returns Promesse qui se résout en true si l'utilisateur est connecté, false sinon
   */
  async isConnected(userId: string): Promise<boolean> {
    return (await this.findRefreshToken(userId)) !== null
  }

  /**
   * Révoque le token d'accès Google Calendar de l'utilisateur
   * et supprime la référence au token dans la base de données.
   * @param userId ID de l'utilisateur
   * @returns Promesse qui se résout en rien
   */
  async disconnect(userId: string): Promise<void> {
    const refreshToken = await this.findRefreshToken(userId)

    if (refreshToken) {
      try {
        const oauth2Client = this.getOAuth2Client()
        await oauth2Client.revokeToken(refreshToken)
      } catch {
        // Token déjà révoqué côté Google, on continue quand même
      }
    }

    await this.clearRefreshToken(userId)
  }
}
