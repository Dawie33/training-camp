import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthService } from '../auth.service'

interface JwtPayload {
  sub: string
  email: string
  iat?: number
  exp?: number
}

/**
 * JwtStrategy is a class that extends the PassportStrategy
 * récupère le token dans le header, ignore les tokens expirés,
 * utilise la clé JWT_SECRET pour verifier le token
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
    })
  }

  /**
   * Validation de l'utilisateur en fonction de son identifiant.
   * Si l'utilisateur n'est pas trouvé on leve une exception.
   * @param {JwtPayload} payload identifiant de l'utilisateur
   * @returns {Promise<User>} utilisateur si existant.
   */
  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload.sub)
    if (!user) {
      throw new UnauthorizedException()
    }
    return user
  }
}
