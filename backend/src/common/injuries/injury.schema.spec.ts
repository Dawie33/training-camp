import { parseStoredInjuries } from './injury.schema'

const validInjury = { zone: 'knee', side: 'left', status: 'recovering', severity: 'mild', painful_patterns: ['impact'] }

describe('parseStoredInjuries', () => {
  it.each([
    ['null', null],
    ["l'ancien tableau de chaînes de l'onboarding", ['genou', 'épaule']],
    ["l'ancien objet libre", { shoulder: 'left' }],
    ['du JSON invalide', '{pas du json'],
  ])('renvoie une liste vide pour %s', (_case, raw) => {
    expect(parseStoredInjuries(raw)).toEqual([])
  })

  it('garde une blessure valide', () => {
    expect(parseStoredInjuries([validInjury])).toEqual([validInjury])
  })

  it('lit aussi une colonne renvoyée sous forme de chaîne JSON', () => {
    expect(parseStoredInjuries(JSON.stringify([validInjury]))).toEqual([validInjury])
  })

  it('ignore les entrées invalides et garde les autres', () => {
    expect(parseStoredInjuries(['genou', { ...validInjury, zone: 'tete' }, validInjury])).toEqual([validInjury])
  })

  it('complète painful_patterns absent par une liste vide', () => {
    const { painful_patterns: _omitted, ...withoutPatterns } = validInjury
    expect(parseStoredInjuries([withoutPatterns])).toEqual([{ ...withoutPatterns, painful_patterns: [] }])
  })
})
