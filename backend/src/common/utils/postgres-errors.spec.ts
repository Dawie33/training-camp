import { isUniqueViolation } from './postgres-errors'

describe('isUniqueViolation', () => {
  const duplicate = { code: '23505', constraint: 'scheduled_activities_user_date_type_unique' }

  it("reconnaît une violation d'unicité", () => {
    expect(isUniqueViolation(duplicate)).toBe(true)
  })

  it("reconnaît l'index précis quand il est demandé", () => {
    expect(isUniqueViolation(duplicate, 'scheduled_activities_user_date_type_unique')).toBe(true)
    expect(isUniqueViolation(duplicate, 'un_autre_index')).toBe(false)
  })

  it.each([
    ['une autre erreur PostgreSQL (clé étrangère)', { code: '23503' }],
    ['une erreur JavaScript', new Error('connexion perdue')],
    ['null', null],
  ])('ne confond pas %s avec un doublon', (_case, error) => {
    expect(isUniqueViolation(error)).toBe(false)
  })
})
