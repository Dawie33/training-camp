import { safeJsonStringify, slugify } from './utils'

describe('slugify', () => {
  it.each([
    ['Squat', 'squat'],
    ['Développé couché', 'developpe-couche'],
    ['Soulevé de terre', 'souleve-de-terre'],
    ['Élévations latérales', 'elevations-laterales'],
    ['  Air   Squat  ', 'air-squat'],
    ['Toes-to-Bar', 'toes-to-bar'],
  ])('« %s » → « %s »', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  it('ignore le contenu entre parenthèses', () => {
    expect(slugify('Fente bulgare (haltères)')).toBe('fente-bulgare')
  })
})

describe('safeJsonStringify', () => {
  /** Le résultat doit toujours être accepté par une colonne json PostgreSQL : JSON.parse ne doit pas lever. */
  const expectValidJson = (result: string | null) => {
    expect(result).not.toBeNull()
    expect(() => JSON.parse(result as string)).not.toThrow()
  }

  it.each([undefined, null, ''])('renvoie null pour %p sans valeur par défaut', value => {
    expect(safeJsonStringify(value)).toBeNull()
  })

  it('renvoie la valeur par défaut sérialisée quand la valeur est absente', () => {
    expect(safeJsonStringify(undefined, [])).toBe('[]')
    expect(safeJsonStringify(null, {})).toBe('{}')
  })

  it('sérialise les objets et les tableaux', () => {
    expect(safeJsonStringify({ sections: [] })).toBe('{"sections":[]}')
    expect(safeJsonStringify(['cardio', 'force'])).toBe('["cardio","force"]')
    expect(safeJsonStringify([])).toBe('[]')
    expect(safeJsonStringify({})).toBe('{}')
  })

  it('sérialise les nombres et booléens', () => {
    expect(safeJsonStringify(42)).toBe('42')
    expect(safeJsonStringify(true)).toBe('true')
  })

  it('garde telle quelle une chaîne qui est déjà du JSON valide', () => {
    expect(safeJsonStringify('{"sections":[]}')).toBe('{"sections":[]}')
    expect(safeJsonStringify('["cardio"]')).toBe('["cardio"]')
  })

  it.each(['pas du json', '{sections: []}', "['cardio']", '{"ouvert":'])(
    'encode en chaîne JSON une chaîne non-JSON (%p) au lieu de la renvoyer brute',
    value => {
      const result = safeJsonStringify(value)

      expectValidJson(result)
      expect(JSON.parse(result as string)).toBe(value)
    }
  )
})
