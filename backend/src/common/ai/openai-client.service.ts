import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'
import type { ChatCompletion } from 'openai/resources/chat/completions'

/**
 * Délai maximal d'une requête OpenAI. Le SDK attend 10 min par défaut : un appel bloqué
 * immobiliserait le backend bien après que le navigateur a abandonné. 120 s laissent de la marge
 * aux générations les plus longues (4 096 tokens ≈ 40-60 s en temps normal).
 */
export const OPENAI_TIMEOUT_MS = 120_000

/** Une seule nouvelle tentative (2 par défaut) : chaque tentative aboutie est facturée. */
export const OPENAI_MAX_RETRIES = 1

/**
 * Marge ajoutée au plafond de sortie des modèles à raisonnement (GPT-5+) : leur réflexion, invisible,
 * est décomptée de max_completion_tokens. Sans cette marge, elle peut consommer tout le budget et
 * laisser une réponse vide. Seuls les tokens réellement produits sont facturés.
 */
export const REASONING_TOKEN_BUDGET = 12_000

@Injectable()
export class OpenAIClientService {
  private readonly logger = new Logger(OpenAIClientService.name)
  readonly client: OpenAI
  readonly model: string = process.env.OPENAI_MODEL ?? 'gpt-4.1'
  // Les gpt-4.x n'ont pas de phase de raisonnement ; les modèles plus récents (GPT-5+) si
  private readonly isReasoningModel = !this.model.startsWith('gpt-4')

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    this.client = new OpenAI({ apiKey, timeout: OPENAI_TIMEOUT_MS, maxRetries: OPENAI_MAX_RETRIES })
  }

  // Les modèles récents (GPT-5+) n'acceptent que la température par défaut : on ne l'envoie qu'aux gpt-4.x
  temperatureParam(value: number): { temperature?: number } {
    return this.isReasoningModel ? {} : { temperature: value }
  }

  // maxOutputTokens = taille du JSON attendu ; les modèles à raisonnement reçoivent en plus de quoi réfléchir
  completionParams(maxOutputTokens: number): { max_completion_tokens: number; reasoning_effort?: 'low' } {
    return this.isReasoningModel
      ? { max_completion_tokens: maxOutputTokens + REASONING_TOKEN_BUDGET, reasoning_effort: 'low' }
      : { max_completion_tokens: maxOutputTokens }
  }

  // Message d'erreur quand la réponse n'a pas de contenu, avec la raison donnée par OpenAI
  emptyResponseMessage(completion: ChatCompletion): string {
    const finishReason = completion.choices[0]?.finish_reason
    this.logger.warn(
      `Réponse vide de ${this.model} (finish_reason: ${finishReason}, usage: ${JSON.stringify(completion.usage)})`
    )

    return finishReason === 'length'
      ? "Réponse de l'IA tronquée : limite de tokens atteinte"
      : `Réponse vide de l'IA (finish_reason: ${finishReason ?? 'inconnu'})`
  }
}
