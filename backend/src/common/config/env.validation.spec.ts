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
})
