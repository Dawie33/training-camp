import { buildEventTimes } from './calendar-event-time'

describe('buildEventTimes', () => {
  it("place la séance à 7 h, heure de Paris, en heure d'été", () => {
    expect(buildEventTimes('2026-07-15', 60)).toEqual({
      start: { dateTime: '2026-07-15T07:00:00', timeZone: 'Europe/Paris' },
      end: { dateTime: '2026-07-15T08:00:00', timeZone: 'Europe/Paris' },
    })
  })

  it("garde 7 h en heure d'hiver : c'est Google qui gère le décalage", () => {
    expect(buildEventTimes('2026-01-15', 60).start).toEqual({
      dateTime: '2026-01-15T07:00:00',
      timeZone: 'Europe/Paris',
    })
  })

  it('calcule la fin à partir de la durée', () => {
    expect(buildEventTimes('2026-10-05', 75).end.dateTime).toBe('2026-10-05T08:15:00')
  })

  it('dure 60 minutes par défaut', () => {
    expect(buildEventTimes('2026-10-05').end.dateTime).toBe('2026-10-05T08:00:00')
  })

  it('passe au lendemain si la séance dépasse minuit', () => {
    expect(buildEventTimes('2026-10-05', 18 * 60).end.dateTime).toBe('2026-10-06T01:00:00')
  })

  it("ne lit que la date d'une date-heure, comme PostgreSQL pour une colonne date", () => {
    expect(buildEventTimes('2026-10-05T22:00:00.000Z').start.dateTime).toBe('2026-10-05T07:00:00')
  })

  it('ne dépend pas du fuseau du serveur', () => {
    const originalTz = process.env.TZ
    process.env.TZ = 'America/New_York'
    try {
      expect(buildEventTimes('2026-07-15').start.dateTime).toBe('2026-07-15T07:00:00')
    } finally {
      // Affecter undefined écrirait la chaîne « undefined » : on supprime la variable si elle n'existait pas
      if (originalTz === undefined) delete process.env.TZ
      else process.env.TZ = originalTz
    }
  })
})
