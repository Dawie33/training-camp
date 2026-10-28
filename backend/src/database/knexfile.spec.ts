import config, { getKnexConfig } from './knexfile'

describe('knexfile', () => {
  it.each(['development', 'production', 'test'])('définit un environnement %s', env => {
    expect(getKnexConfig(env).client).toBe('pg')
  })

  it('couvre exactement les NODE_ENV acceptés par la validation Joi', () => {
    expect(Object.keys(config).sort()).toEqual(['development', 'production', 'test'])
  })

  it('utilise une base dédiée, suffixée _test, pour les tests', () => {
    const connection = getKnexConfig('test').connection as { database: string }

    expect(connection.database).toMatch(/_test$/)
  })

  it('refuse explicitement un environnement inconnu', () => {
    expect(() => getKnexConfig('staging')).toThrow('Aucune configuration Knex pour NODE_ENV="staging"')
  })
})
