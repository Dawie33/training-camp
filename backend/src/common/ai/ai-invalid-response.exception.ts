import { BadGatewayException } from '@nestjs/common'

export const AI_INVALID_RESPONSE_MESSAGE = "L'IA a renvoyé une réponse inexploitable, réessaie"

/**
 * Réponse de l'IA vide, hors JSON ou non conforme au schéma attendu (HTTP 502).
 * Classe dédiée pour qu'un service puisse distinguer ce cas d'une panne ou d'un timeout d'OpenAI.
 */
export class AIInvalidResponseException extends BadGatewayException {
  constructor() {
    super(AI_INVALID_RESPONSE_MESSAGE)
  }
}
