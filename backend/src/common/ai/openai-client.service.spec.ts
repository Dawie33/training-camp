import { BadGatewayException, GatewayTimeoutException, Logger } from '@nestjs/common'
import { APIConnectionTimeoutError, InternalServerError } from 'openai'
import { z } from 'zod'
import { AI_INVALID_RESPONSE_MESSAGE, AIInvalidResponseException } from './ai-invalid-response.exception'
import {
  OPENAI_MAX_RETRIES,
  OPENAI_TIMEOUT_MS,
  OpenAIClientService,
  REASONING_TOKEN_BUDGET,
} from './openai-client.service'

// Les erreurs de l'IA sont journalisées : on évite de polluer la sortie
const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

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

  describe('createJsonCompletion', () => {
    const schema = z.object({ summary: z.string() })
    let service: OpenAIClientService
    let create: jest.SpyInstance

    beforeEach(() => {
      warn.mockClear()
      service = new OpenAIClientService()
      create = jest.spyOn(service.client.chat.completions, 'create')
    })

    function respondWith(content: string | null, finishReason = 'stop') {
      create.mockResolvedValue({ choices: [{ finish_reason: finishReason, message: { content } }] })
    }

    function request() {
      return service.createJsonCompletion({
        purpose: 'test',
        messages: [{ role: 'user', content: 'prompt' }],
        temperature: 0.7,
        maxOutputTokens: 800,
        schema,
      })
    }

    it('renvoie la réponse validée par le schéma', async () => {
      respondWith('{"summary": "Bonne séance"}')

      await expect(request()).resolves.toEqual({ summary: 'Bonne séance' })
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ response_format: { type: 'json_object' } }))
    })

    it('JSON invalide → 502 générique', async () => {
      respondWith('pas du json')

      await expect(request()).rejects.toThrow(AIInvalidResponseException)
    })

    it('schéma non respecté → 502 sans le détail Zod, détail dans les logs', async () => {
      respondWith('{"résumé": "Bonne séance"}')

      const error = await request().catch((e: unknown) => e)

      expect(error).toBeInstanceOf(AIInvalidResponseException)
      expect((error as AIInvalidResponseException).message).toBe(AI_INVALID_RESPONSE_MESSAGE)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('summary'))
    })

    it('réponse vide (limite de tokens) → 502 générique', async () => {
      respondWith('', 'length')

      await expect(request()).rejects.toThrow(AIInvalidResponseException)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('finish_reason: length'))
    })

    it('délai OpenAI dépassé → 504', async () => {
      create.mockRejectedValue(new APIConnectionTimeoutError())

      await expect(request()).rejects.toThrow(GatewayTimeoutException)
    })

    it("erreur OpenAI → 502 sans le message d'OpenAI", async () => {
      create.mockRejectedValue(new InternalServerError(500, undefined, 'secret interne', new Headers()))

      const error = await request().catch((e: unknown) => e)

      expect(error).toBeInstanceOf(BadGatewayException)
      expect(error).not.toBeInstanceOf(AIInvalidResponseException)
      expect((error as BadGatewayException).message).not.toContain('secret interne')
    })
  })
})
