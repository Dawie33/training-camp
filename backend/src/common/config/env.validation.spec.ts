import { envValidationSchema } from './env.validation'

// Variables minimales pour que l'application démarre
const minimalEnv = {
  DATABASE_HOST: 'localhost',
  OPENAI_API_KEY: 'sk-test',
  JWT_SECRET: 'x'.repeat(64),
}

describe('envValidationSchema', () => {
  it('accepte la configuration minimale et applique les valeurs par défaut', () => {
    const { error, value } = envValidationSchema.validate(minimalEnv)

    expect(error).toBeUndefined()
    // 3001 et non 3000 : 3000 est le port du frontend
    expect(value.PORT).toBe(3001)
    expect(value.TRUST_PROXY).toBe(0)
    expect(value.NODE_ENV).toBe('development')
  })

  it.each(['OPENAI_API_KEY', 'JWT_SECRET'])('refuse de démarrer sans %s', key => {
    const env: Record<string, string> = { ...minimalEnv }
    delete env[key]

    expect(envValidationSchema.validate(env).error).toBeDefined()
  })

  it('exige DATABASE_URL ou DATABASE_HOST', () => {
    const { DATABASE_HOST: _omitted, ...withoutDatabase } = minimalEnv

    expect(envValidationSchema.validate(withoutDatabase).error).toBeDefined()
  })

  it('refuse un ORIGIN_SECRET de moins de 32 caractères', () => {
    expect(envValidationSchema.validate({ ...minimalEnv, ORIGIN_SECRET: 'court' }).error).toBeDefined()
  })

  it('refuse un JWT_SECRET de moins de 32 caractères', () => {
    expect(envValidationSchema.validate({ ...minimalEnv, JWT_SECRET: 'secret123' }).error).toBeDefined()
  })

  describe('FRONTEND_URL', () => {
    it('vaut localhost:3000 par défaut en développement', () => {
      expect(envValidationSchema.validate(minimalEnv).value.FRONTEND_URL).toBe('http://localhost:3000')
    })

    it('est obligatoire en production', () => {
      expect(envValidationSchema.validate({ ...minimalEnv, NODE_ENV: 'production' }).error).toBeDefined()
    })

    it('est acceptée en production quand elle est définie', () => {
      const env = { ...minimalEnv, NODE_ENV: 'production', FRONTEND_URL: 'https://training-camp.vercel.app' }
      const { error, value } = envValidationSchema.validate(env)

      expect(error).toBeUndefined()
      expect(value.FRONTEND_URL).toBe('https://training-camp.vercel.app')
    })
  })

  describe('TOKEN_ENCRYPTION_KEY', () => {
    // Clé de test générée pour l'exemple, jamais utilisée ailleurs
    const validKey = 'ab'.repeat(32)
    const googleEnv = { ...minimalEnv, GOOGLE_CLIENT_ID: 'client-id' }

    it('est facultative si Google Agenda n’est pas configuré', () => {
      expect(envValidationSchema.validate(minimalEnv).error).toBeUndefined()
    })

    it('est obligatoire dès que GOOGLE_CLIENT_ID est défini', () => {
      expect(envValidationSchema.validate(googleEnv).error).toBeDefined()
    })

    it('accepte 64 caractères hexadécimaux', () => {
      expect(envValidationSchema.validate({ ...googleEnv, TOKEN_ENCRYPTION_KEY: validKey }).error).toBeUndefined()
    })

    it.each([
      ['trop courte', 'ab'.repeat(16)],
      ['non hexadécimale', 'z'.repeat(64)],
    ])('refuse une clé %s', (_case, value) => {
      expect(envValidationSchema.validate({ ...minimalEnv, TOKEN_ENCRYPTION_KEY: value }).error).toBeDefined()
    })
  })
})
