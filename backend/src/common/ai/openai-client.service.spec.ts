import type { ChatCompletion } from 'openai/resources/chat/completions'
import { Logger } from '@nestjs/common'
import {
  OPENAI_MAX_RETRIES,
  OPENAI_TIMEOUT_MS,
  OpenAIClientService,
  REASONING_TOKEN_BUDGET,
} from './openai-client.service'

// Les tests de réponse vide passent par logger.warn : on évite de polluer la sortie
jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)

describe('OpenAIClientService', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, OPENAI_API_KEY: 'sk-test' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('borne la durée et le nombre de tentatives des requêtes', () => {
    const service = new OpenAIClientService()

    expect(service.client.timeout).toBe(OPENAI_TIMEOUT_MS)
    expect(service.client.maxRetries).toBe(OPENAI_MAX_RETRIES)
  })

  it('refuse de démarrer sans clé API', () => {
    delete process.env.OPENAI_API_KEY

    expect(() => new OpenAIClientService()).toThrow('OPENAI_API_KEY')
  })

  it("n'envoie la température qu'aux modèles gpt-4.x", () => {
    process.env.OPENAI_MODEL = 'gpt-4.1'
    expect(new OpenAIClientService().temperatureParam(0.7)).toEqual({ temperature: 0.7 })

    process.env.OPENAI_MODEL = 'gpt-5'
    expect(new OpenAIClientService().temperatureParam(0.7)).toEqual({})
  })

  it('garde le plafond de tokens tel quel pour les gpt-4.x', () => {
    process.env.OPENAI_MODEL = 'gpt-4.1'

    expect(new OpenAIClientService().completionParams(4096)).toEqual({ max_completion_tokens: 4096 })
  })

  it('laisse de la place au raisonnement des modèles récents', () => {
    process.env.OPENAI_MODEL = 'gpt-6-luna'

    expect(new OpenAIClientService().completionParams(4096)).toEqual({
      max_completion_tokens: 4096 + REASONING_TOKEN_BUDGET,
      reasoning_effort: 'low',
    })
  })

  it('explique une réponse vide coupée par la limite de tokens', () => {
    const service = new OpenAIClientService()
    const completion = { choices: [{ finish_reason: 'length', message: { content: '' } }] } as ChatCompletion

    expect(service.emptyResponseMessage(completion)).toBe("Réponse de l'IA tronquée : limite de tokens atteinte")
  })
})
