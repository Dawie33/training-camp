import { OPENAI_MAX_RETRIES, OPENAI_TIMEOUT_MS, OpenAIClientService } from './openai-client.service'

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
})
