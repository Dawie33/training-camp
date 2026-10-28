import { addWeeks, computeTrainingVolume, enumerateWeeks, weekStart } from './training-volume'

// Dates écrites à l'heure de Paris (+02:00 en été, +01:00 en hiver) : les semaines se calculent
// à Paris, le résultat ne doit pas dépendre du fuseau de la machine qui lance les tests.

describe('weekStart', () => {
  it('ramène chaque jour au lundi de sa semaine', () => {
    expect(weekStart(new Date('2026-09-16T14:00:00+02:00'))).toBe('2026-09-14')
    expect(weekStart(new Date('2026-09-14T06:00:00+02:00'))).toBe('2026-09-14')
  })

  it('range une séance du lundi 0 h 30 à Paris dans sa semaine, même si le serveur est en UTC', () => {
    // 0 h 30 à Paris = dimanche 22 h 30 en UTC : à l'heure du serveur, la séance reculait d'une semaine
    expect(weekStart(new Date('2026-09-20T22:30:00.000Z'))).toBe('2026-09-21')
    expect(weekStart(new Date('2026-11-01T23:30:00.000Z'))).toBe('2026-11-02')
  })

  it('rattache le dimanche à la semaine qui s’achève', () => {
    expect(weekStart(new Date('2026-09-20T23:00:00+02:00'))).toBe('2026-09-14')
  })
})

describe('addWeeks', () => {
  it('avance et recule d’une semaine, y compris au changement d’heure', () => {
    expect(addWeeks('2026-10-19', 1)).toBe('2026-10-26')
    expect(addWeeks('2026-10-26', -1)).toBe('2026-10-19')
    expect(addWeeks('2026-12-28', 1)).toBe('2027-01-04')
  })
})

describe('enumerateWeeks', () => {
  it('liste chaque lundi de la plage, bornes comprises', () => {
    expect(enumerateWeeks(new Date('2026-09-16T10:00:00+02:00'), new Date('2026-09-30T10:00:00+02:00'))).toEqual([
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
    ])
  })

  it('traverse le changement d’heure sans sauter ni doubler de semaine', () => {
    expect(enumerateWeeks(new Date('2026-10-20T10:00:00+02:00'), new Date('2026-11-03T10:00:00+01:00'))).toEqual([
      '2026-10-19',
      '2026-10-26',
      '2026-11-02',
    ])
  })

  it('renvoie une liste vide quand la plage est inversée', () => {
    expect(enumerateWeeks(new Date('2026-09-30T10:00:00+02:00'), new Date('2026-09-16T10:00:00+02:00'))).toEqual([])
  })
})

describe('computeTrainingVolume', () => {
  it('agrège le volume et la moyenne hebdomadaire', () => {
    const result = computeTrainingVolume(
      [
        { started_at: '2026-09-01T10:00:00+02:00' },
        { started_at: '2026-09-03T10:00:00+02:00' },
        { started_at: '2026-09-08T10:00:00+02:00' },
        { started_at: '2026-09-15T10:00:00+02:00' },
      ],
      new Date('2026-09-01T00:00:00+02:00'),
      new Date('2026-09-16T12:00:00+02:00')
    )

    expect(result.total_sessions).toBe(4)
    expect(result.week_span).toBe(3)
    expect(result.avg_per_week).toBe(1.3)
    expect(result.consistency_pct).toBe(100)
  })

  it('fait apparaître les semaines sans séance', () => {
    const result = computeTrainingVolume(
      [{ started_at: '2026-09-01T10:00:00+02:00' }, { started_at: '2026-09-22T10:00:00+02:00' }],
      new Date('2026-09-01T00:00:00+02:00'),
      new Date('2026-09-23T12:00:00+02:00')
    )

    expect(result.weeks).toEqual([
      { week_start: '2026-08-31', session_count: 1 },
      { week_start: '2026-09-07', session_count: 0 },
      { week_start: '2026-09-14', session_count: 0 },
      { week_start: '2026-09-21', session_count: 1 },
    ])
    expect(result.consistency_pct).toBe(50)
  })

  it('fait chuter la régularité après un arrêt', () => {
    // 3 semaines d'entraînement en début de période, puis plus rien pendant 2 mois et demi
    const result = computeTrainingVolume(
      [
        { started_at: '2026-07-01T10:00:00+02:00' },
        { started_at: '2026-07-08T10:00:00+02:00' },
        { started_at: '2026-07-15T10:00:00+02:00' },
      ],
      new Date('2026-06-23T00:00:00+02:00'),
      new Date('2026-09-23T12:00:00+02:00')
    )

    expect(result.week_span).toBe(13)
    expect(result.consistency_pct).toBe(23)
  })

  it('ne pénalise pas la semaine en cours tant qu’elle est vide', () => {
    // Un lundi matin : la semaine vient de commencer, rien n'a encore été manqué
    const result = computeTrainingVolume(
      [{ started_at: '2026-09-15T10:00:00+02:00' }],
      new Date('2026-09-14T00:00:00+02:00'),
      new Date('2026-09-21T08:00:00+02:00')
    )

    expect(result.week_span).toBe(1)
    expect(result.consistency_pct).toBe(100)
  })

  it('compte la semaine en cours dès qu’elle porte une séance', () => {
    // Un lundi puis le lundi suivant : deux semaines entraînées, pas une
    const result = computeTrainingVolume(
      [{ started_at: '2026-09-14T10:00:00+02:00' }, { started_at: '2026-09-21T10:00:00+02:00' }],
      new Date('2026-09-14T00:00:00+02:00'),
      new Date('2026-09-21T12:00:00+02:00')
    )

    expect(result.week_span).toBe(2)
    expect(result.avg_per_week).toBe(1)
    expect(result.consistency_pct).toBe(100)
  })

  it('ignore les dates invalides', () => {
    const result = computeTrainingVolume(
      [{ started_at: '2026-09-01T10:00:00+02:00' }, { started_at: 'pas une date' }],
      new Date('2026-09-01T00:00:00+02:00'),
      new Date('2026-09-02T12:00:00+02:00')
    )

    expect(result.total_sessions).toBe(1)
  })

  it('reste neutre sans séance', () => {
    expect(computeTrainingVolume([], new Date('2026-09-01T00:00:00+02:00'))).toEqual({
      total_sessions: 0,
      week_span: 0,
      avg_per_week: 0,
      consistency_pct: 0,
      weeks: [],
    })
  })
})
