import { classifyAcwr, computeTrainingLoad, resolveSessionMinutes } from './training-load'

describe('resolveSessionMinutes', () => {
  it('retient la durée totale saisie plutôt que le chrono du metcon', () => {
    // Séance de 70 min dont le metcon n'a duré que 12 min
    expect(resolveSessionMinutes({ session_duration_minutes: 70, elapsed_time_seconds: 720 })).toBe(70)
  })

  it('se rabat sur la durée de l’activité .fit', () => {
    expect(resolveSessionMinutes({ coros: { totals: { duration_seconds: 2730 } } })).toBe(46)
  })

  it('ignore le chrono du metcon quand rien d’autre n’est disponible', () => {
    expect(resolveSessionMinutes({ elapsed_time_seconds: 720 })).toBeNull()
    expect(resolveSessionMinutes(null)).toBeNull()
  })
})

describe('classifyAcwr', () => {
  it('situe le ratio dans sa zone de risque', () => {
    expect(classifyAcwr(0.6)).toBe('undertrained')
    expect(classifyAcwr(1.0)).toBe('optimal')
    expect(classifyAcwr(1.3)).toBe('optimal')
    expect(classifyAcwr(1.45)).toBe('caution')
    expect(classifyAcwr(1.8)).toBe('high_risk')
  })
})

describe('computeTrainingLoad', () => {
  const now = new Date('2026-09-21T12:00:00.000Z')

  it('calcule la charge de séance en RPE × minutes', () => {
    const result = computeTrainingLoad(
      [{ started_at: '2026-09-21T09:00:00.000Z', rpe: 8, session_minutes: 60 }],
      now
    )

    expect(result.available).toBe(true)
    expect(result.weeks[0].srpe).toBe(480)
  })

  it('se rabat sur une durée type quand la séance n’en porte pas', () => {
    const result = computeTrainingLoad([{ started_at: '2026-09-21T09:00:00.000Z', rpe: 7 }], now)

    expect(result.weeks[0].srpe).toBe(420)
  })

  it('signale l’indisponibilité tant qu’aucune séance ne porte de RPE', () => {
    const result = computeTrainingLoad([{ started_at: '2026-09-21T09:00:00.000Z', session_minutes: 60 }], now)

    expect(result.available).toBe(false)
    expect(result.sessions_with_rpe).toBe(0)
    expect(result.acwr).toBeNull()
    expect(result.acwr_zone).toBeNull()
  })

  it('place une charge stable dans la zone optimale', () => {
    // 15 séances tous les 2 jours : l'historique couvre les 28 jours de la fenêtre chronique
    const sessions = Array.from({ length: 15 }, (_, i) => ({
      started_at: new Date(now.getTime() - i * 2 * 24 * 3600 * 1000).toISOString(),
      rpe: 7,
      session_minutes: 60,
    }))

    const result = computeTrainingLoad(sessions, now)

    expect(result.acwr_zone).toBe('optimal')
  })

  it('retient l’ACWR tant que l’historique ne couvre pas 28 jours', () => {
    const sessions = Array.from({ length: 6 }, (_, i) => ({
      started_at: new Date(now.getTime() - i * 2 * 24 * 3600 * 1000).toISOString(),
      rpe: 8,
      session_minutes: 60,
    }))

    const result = computeTrainingLoad(sessions, now)

    // La charge hebdomadaire reste affichable, seul le ratio attend d'être fiable
    expect(result.available).toBe(true)
    expect(result.weeks.length).toBeGreaterThan(0)
    expect(result.acwr).toBeNull()
    expect(result.acwr_zone).toBeNull()
  })

  it('détecte une montée brutale de charge sur la semaine écoulée', () => {
    const sessions = [
      // Fond de charge léger étalé sur toute la fenêtre chronique
      ...Array.from({ length: 6 }, (_, i) => ({
        started_at: new Date(now.getTime() - (28 - i * 4) * 24 * 3600 * 1000).toISOString(),
        rpe: 5,
        session_minutes: 30,
      })),
      // Semaine récente très chargée
      ...Array.from({ length: 5 }, (_, i) => ({
        started_at: new Date(now.getTime() - i * 24 * 3600 * 1000).toISOString(),
        rpe: 9,
        session_minutes: 80,
      })),
    ]

    const result = computeTrainingLoad(sessions, now)

    expect(result.acwr).toBeGreaterThan(1.5)
    expect(result.acwr_zone).toBe('high_risk')
  })

  it('exprime la variation de la dernière semaine en pourcentage', () => {
    const result = computeTrainingLoad(
      [
        { started_at: '2026-09-08T09:00:00.000Z', rpe: 5, session_minutes: 60 },
        { started_at: '2026-09-15T09:00:00.000Z', rpe: 10, session_minutes: 60 },
      ],
      now
    )

    expect(result.last_week_change_pct).toBe(100)
  })

  it('ignore les RPE hors échelle ou absents', () => {
    const result = computeTrainingLoad(
      [
        { started_at: '2026-09-21T09:00:00.000Z', rpe: 8, session_minutes: 60 },
        { started_at: '2026-09-21T11:00:00.000Z', rpe: 0, session_minutes: 60 },
        { started_at: '2026-09-21T13:00:00.000Z', rpe: null, session_minutes: 60 },
      ],
      now
    )

    expect(result.sessions_with_rpe).toBe(1)
  })
})
