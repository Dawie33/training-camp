import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { timingSafeEqual } from 'crypto'
import type { NextFunction, Request, Response } from 'express'

export const ORIGIN_SECRET_HEADER = 'x-origin-secret'

/**
 * Verrou d'origine : n'accepte que les requêtes passées par le frontend Vercel,
 * qui ajoute l'en-tête x-origin-secret (voir frontend/proxy.ts).
 * Empêche d'appeler l'API en direct sur Render, ce qui permettrait de falsifier
 * X-Forwarded-For et de contourner le rate limiting.
 * Désactivé si ORIGIN_SECRET n'est pas défini (développement local).
 */
@Injectable()
export class OriginSecretMiddleware implements NestMiddleware {
  private readonly secret: Buffer | null

  constructor(config: ConfigService) {
    const secret = config.get<string>('ORIGIN_SECRET')
    this.secret = secret ? Buffer.from(secret) : null
  }

  use(req: Request, _res: Response, next: NextFunction): void {
    if (this.secret && !this.isValid(req.headers[ORIGIN_SECRET_HEADER], this.secret)) {
      throw new ForbiddenException()
    }
    next()
  }

  private isValid(received: string | string[] | undefined, secret: Buffer): boolean {
    if (typeof received !== 'string') return false
    const receivedBuffer = Buffer.from(received)
    // timingSafeEqual exige deux buffers de même longueur, et compare en temps constant
    // pour qu'on ne puisse pas deviner le secret en mesurant les temps de réponse
    return receivedBuffer.length === secret.length && timingSafeEqual(receivedBuffer, secret)
  }
}
