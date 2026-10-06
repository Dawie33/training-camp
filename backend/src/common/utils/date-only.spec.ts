import { toDateOnly } from './date-only'

describe('toDateOnly', () => {
  it("lit le jour d'une colonne date renvoyée par pg (minuit, heure locale)", () => {
    // C'est ainsi que le driver pg construit une colonne `date` : new Date(année, mois, jour)
    expect(toDateOnly(new Date(2026, 9, 6))).toBe('2026-10-06')
  })

  it("garde les 10 premiers caractères d'une chaîne", () => {
    expect(toDateOnly('2026-10-06')).toBe('2026-10-06')
    expect(toDateOnly('2026-10-06T00:00:00.000Z')).toBe('2026-10-06')
  })

  it('complète les mois et les jours à un chiffre', () => {
    expect(toDateOnly(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it("ne recule pas d'un jour là où toISOString() le faisait (fuseau de Paris)", () => {
    const fromDb = new Date(2026, 9, 6)

    // Ce test n'est significatif que dans un fuseau en avance sur UTC, comme celui de ton poste
    if (fromDb.getTimezoneOffset() < 0) {
      expect(fromDb.toISOString().slice(0, 10)).toBe('2026-10-05')
    }
    expect(toDateOnly(fromDb)).toBe('2026-10-06')
  })
})
