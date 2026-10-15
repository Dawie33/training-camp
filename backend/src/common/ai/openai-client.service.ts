import { BadGatewayException, GatewayTimeoutException, Injectable, Logger } from '@nestjs/common'
import OpenAI, { APIConnectionTimeoutError } from 'openai'
import type { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import type { z } from 'zod'
import { AIInvalidResponseException } from './ai-invalid-response.exception'

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

export interface JsonCompletionRequest<S extends z.ZodTypeAny> {
  /** Usage de l'appel, repris dans les logs (ex. « bilan de progression ») */
  purpose: string
  messages: ChatCompletionMessageParam[]
  temperature: number
  /** Taille maximale du JSON attendu, en tokens */
  maxOutputTokens: number
  /** Schéma que la réponse doit respecter */
  schema: S
}

@Injectable()
export class OpenAIClientService {
  private readonly logger = new Logger(OpenAIClientService.name)
  readonly client: OpenAI
  readonly model: string = process.env.OPENAI_MODEL ?? 'gpt-6-luna'
  // Les gpt-4.x n'ont pas de phase de raisonnement ; les modèles plus récents (GPT-5+ et GPT-6) si
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

  /**
   * Demande une réponse JSON à l'IA et la valide avec le schéma.
   * Les erreurs sont traduites en réponses HTTP génériques : le détail (erreurs Zod, message d'OpenAI)
   * part dans les logs, jamais dans la réponse au client.
   * @throws GatewayTimeoutException (504) si OpenAI ne répond pas dans le délai
   * @throws BadGatewayException (502) si OpenAI est en erreur
   * @throws AIInvalidResponseException (502) si la réponse est vide, hors JSON ou non conforme au schéma
   */
  async createJsonCompletion<S extends z.ZodTypeAny>(request: JsonCompletionRequest<S>): Promise<z.output<S>> {
    const { purpose, messages, temperature, maxOutputTokens, schema } = request

    let completion: ChatCompletion
    try {
      completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        ...this.temperatureParam(temperature),
        ...this.completionParams(maxOutputTokens),
        response_format: { type: 'json_object' },
      })
    } catch (error) {
      if (error instanceof APIConnectionTimeoutError) {
        this.logger.warn(`Délai dépassé (${OPENAI_TIMEOUT_MS} ms) pour : ${purpose}`)
        throw new GatewayTimeoutException("L'IA a mis trop de temps à répondre, réessaie")
      }
      this.logger.error(`Erreur OpenAI pour : ${purpose}`, error instanceof Error ? error.stack : String(error))
      throw new BadGatewayException("L'IA est momentanément indisponible, réessaie plus tard")
    }

    const content = completion.choices[0]?.message?.content
    if (!content) {
      this.logEmptyResponse(purpose, completion)
      throw new AIInvalidResponseException()
    }

    let data: unknown
    try {
      data = JSON.parse(content)
    } catch {
      this.logger.warn(`JSON invalide renvoyé par ${this.model} pour : ${purpose}`)
      throw new AIInvalidResponseException()
    }

    const result = schema.safeParse(data)
    if (!result.success) {
      const issues = result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      this.logger.warn(`Réponse de ${this.model} non conforme au schéma pour : ${purpose} — ${issues}`)
      throw new AIInvalidResponseException()
    }

    return result.data
  }

  // Trace la raison donnée par OpenAI quand la réponse n'a pas de contenu (ex. limite de tokens atteinte)
  private logEmptyResponse(purpose: string, completion: ChatCompletion): void {
    const finishReason = completion.choices[0]?.finish_reason
    this.logger.warn(
      `Réponse vide de ${this.model} pour : ${purpose} (finish_reason: ${finishReason}, usage: ${JSON.stringify(completion.usage)})`
    )
  }
}
