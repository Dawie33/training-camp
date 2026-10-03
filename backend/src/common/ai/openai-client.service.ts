import { Injectable } from '@nestjs/common'
import OpenAI from 'openai'

/**
 * Délai maximal d'une requête OpenAI. Le SDK attend 10 min par défaut : un appel bloqué
 * immobiliserait le backend bien après que le navigateur a abandonné. 120 s laissent de la marge
 * aux générations les plus longues (4 096 tokens ≈ 40-60 s en temps normal).
 */
export const OPENAI_TIMEOUT_MS = 120_000

/** Une seule nouvelle tentative (2 par défaut) : chaque tentative aboutie est facturée. */
export const OPENAI_MAX_RETRIES = 1

@Injectable()
export class OpenAIClientService {
  readonly client: OpenAI
  readonly model: string = process.env.OPENAI_MODEL ?? 'gpt-4.1'

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    this.client = new OpenAI({ apiKey, timeout: OPENAI_TIMEOUT_MS, maxRetries: OPENAI_MAX_RETRIES })
  }

  // Les modèles récents (GPT-5+) n'acceptent que la température par défaut : on ne l'envoie qu'aux gpt-4.x
  temperatureParam(value: number): { temperature?: number } {
    return this.model.startsWith('gpt-4') ? { temperature: value } : {}
  }
}
