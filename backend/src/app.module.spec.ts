import { Test } from '@nestjs/testing'

/**
 * Vérifie que toute l'injection de dépendances se résout : un provider qui dépend d'un module
 * retiré par erreur ne serait détecté ni par tsc ni par le build, seulement au démarrage.
 * Aucune connexion n'est ouverte : Knex ne se connecte qu'à la première requête.
 */
describe('AppModule', () => {
  const originalEnv = process.env

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      // 'development' : le knexfile ne définit pas d'environnement 'test'
      NODE_ENV: 'development',
      DATABASE_HOST: 'localhost',
      OPENAI_API_KEY: 'sk-test',
      JWT_SECRET: 'x'.repeat(64),
    }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('résout toutes les dépendances de tous les modules', async () => {
    // Chargé après la configuration de l'environnement : le knexfile et Joi le lisent au chargement
    // (require plutôt qu'import() : Jest ne gère pas les imports dynamiques dans cette configuration)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AppModule } = require('./app.module') as typeof import('./app.module')

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()

    expect(moduleRef).toBeDefined()
    await moduleRef.close()
  })
})
