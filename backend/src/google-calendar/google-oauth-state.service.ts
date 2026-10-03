import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtModuleOptions, JwtService } from '@nestjs/jwt'
import { createHash } from 'crypto'

const STATE_PURPOSE = 'google-oauth'

/**
 * Options du JwtModule propre au state OAuth. La clé est dérivée de JWT_SECRET mais distincte :
 * un state (qui transite par Google et l'historique du navigateur) ne doit jamais être accepté
 * comme jeton de connexion par JwtStrategy.
 */
export function oauthStateJwtOptions(jwtSecret: string): JwtModuleOptions {
  return {
    secret: createHash('sha256').update(`google-oauth-state:${jwtSecret}`).digest('hex'),
    signOptions: { expiresIn: '10m' },
  }
}

/**
 * Paramètre `state` de l'OAuth Google : un JWT signé, valable 10 minutes, qui porte l'id de
 * l'utilisateur. Sans signature, n'importe qui pourrait remplacer l'id par celui d'une victime
 * et relier son propre agenda Google au compte de cette victime.
 */
@Injectable()
export class GoogleOAuthStateService {
  constructor(private readonly jwtService: JwtService) {}

  create(userId: string): string {
    return this.jwtService.sign({ sub: userId, purpose: STATE_PURPOSE })
  }

  /** Renvoie l'id de l'utilisateur, ou lève UnauthorizedException si le state est invalide ou expiré. */
  verify(state: string | undefined): string {
    try {
      const payload = this.jwtService.verify<{ sub?: unknown; purpose?: unknown }>(state ?? '')
      if (payload.purpose === STATE_PURPOSE && typeof payload.sub === 'string') return payload.sub
    } catch {
      // Signature invalide, state expiré ou absent : même réponse dans tous les cas
    }
    throw new UnauthorizedException('State OAuth invalide ou expiré')
  }
}
