import { toDateOnly, toParisDate, toParisWeekStart } from './date-only'

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

describe('toParisDate', () => {
  it.each([
    ["une séance à 0 h 30 à Paris l'été (22 h 30 UTC la veille)", '2026-10-05T22:30:00Z', '2026-10-06'],
    ["une séance à 0 h 30 à Paris l'hiver (23 h 30 UTC la veille)", '2026-01-05T23:30:00Z', '2026-01-06'],
    ['une séance en journée', '2026-10-06T10:00:00Z', '2026-10-06'],
  ])('date %s au bon jour', (_case, instant, expected) => {
    expect(toParisDate(new Date(instant))).toBe(expected)
    expect(toParisDate(instant)).toBe(expected)
  })
})

describe('toParisWeekStart', () => {
  it.each([
    ['un lundi', '2026-10-05T10:00:00Z', '2026-10-05'],
    ['un mercredi', '2026-10-07T10:00:00Z', '2026-10-05'],
    ['un dimanche (fin de semaine)', '2026-10-11T10:00:00Z', '2026-10-05'],
    ['un lundi à 0 h 30 à Paris (encore dimanche en UTC)', '2026-10-04T22:30:00Z', '2026-10-05'],
  ])('rattache %s à son lundi parisien', (_case, instant, expected) => {
    expect(toParisWeekStart(instant)).toBe(expected)
  })
})
