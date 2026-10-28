import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'
import { AuthService } from '../auth.service'

interface JwtPayload {
  sub: string
  email: string
  /** Version des jetons de l'utilisateur au moment de la signature (colonne users.token_version). */
  ver?: number
  iat?: number
  exp?: number
}

/**
 * JwtStrategy extrait le token depuis le cookie httpOnly 'access_token'.
 * Fallback sur le header Authorization Bearer pour la compatibilité.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // config sans `private` : il est utilisé dans super(), avant que `this` existe
  constructor(
    config: ConfigService,
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.access_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload.sub, payload.ver)
    if (!user) {
      throw new UnauthorizedException()
    }
    return user
  }
}
