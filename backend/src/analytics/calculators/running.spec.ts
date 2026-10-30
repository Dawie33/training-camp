import { computeRunning, FitActivityInput, readFitActivities, RunningSessionInput, segmentPace } from './running'

const now = new Date('2026-10-30T18:00:00.000Z')
const periodStart = new Date('2026-07-30T18:00:00.000Z')

/** Sortie de course : `km` kilomètres à `pace` min/km. */
function run(km: number, pace: number, extra: Partial<FitActivityInput> = {}): FitActivityInput {
  return {
    sport: 'running',
    duration_seconds: km * pace * 60,
    distance_meters: km * 1000,
    hr_zones: null,
    laps: [],
    ...extra,
  }
}

const rowing: FitActivityInput = {
  sport: 'rowing',
  duration_seconds: 300,
  distance_meters: null,
  hr_zones: null,
  laps: [],
}

const session = (daysAgo: number, activities: FitActivityInput[]): RunningSessionInput => ({
  started_at: new Date(now.getTime() - daysAgo * 24 * 3600 * 1000).toISOString(),
  activities,
})

describe('segmentPace', () => {
  it('calcule l’allure en min/km', () => {
    expect(segmentPace(1500, 5000)).toBe(5)
  })

  it('écarte les segments trop courts ou hors de la plage de course', () => {
    expect(segmentPace(60, 150)).toBeNull()
    // 1 km en 1 min : erreur de GPS
    expect(segmentPace(60, 1000)).toBeNull()
    // 1 km en 20 min : de la marche
    expect(segmentPace(1200, 1000)).toBeNull()
  })
})

describe('readFitActivities', () => {
  it('relit les activités enregistrées par le log de séance', () => {
    const activities = readFitActivities({
      coros: {
        activities: [
          {
            sport: 'running',
            duration_seconds: 1800,
            distance_meters: 6000,
            hr_zones: [{ zone: 2, label: 'Easy', seconds: 1200, high_bpm: 140 }],
            laps: [{ index: 1, duration_seconds: 300, distance_meters: 1000, intensity: 'active' }],
          },
        ],
        totals: { hr_max_reference: { bpm: 190, source: 'profile' } },
      },
    })

    expect(activities).toEqual([
      {
        sport: 'running',
        duration_seconds: 1800,
        distance_meters: 6000,
        hr_zones: [{ zone: 2, label: 'Easy', seconds: 1200 }],
        laps: [{ duration_seconds: 300, distance_meters: 1000, intensity: 'active' }],
      },
    ])
  })

  it('écarte les zones calculées sur la FC max de la séance ou sans référence connue', () => {
    const activity = { sport: 'running', duration_seconds: 2700, distance_meters: 6000 }
    const zones = [{ zone: 5, label: 'VO2 Max', seconds: 2222, high_bpm: 162 }]
    const read = (totals: unknown) =>
      readFitActivities({ coros: { activities: [{ ...activity, hr_zones: zones }], totals } })

    // Sortie facile dont le pic à 162 bpm devient la FC max : elle passerait à 83 % en zone 5
    expect(read({ hr_max_reference: { bpm: 162, source: 'session' } })[0].hr_zones).toBeNull()
    expect(read({})[0].hr_zones).toBeNull()
    expect(read({ hr_max_reference: { bpm: 185, source: 'age' } })[0].hr_zones).toEqual([
      { zone: 5, label: 'VO2 Max', seconds: 2222 },
    ])
  })

  it('renvoie une liste vide sans import .fit ou avec un format inattendu', () => {
    expect(readFitActivities(null)).toEqual([])
    expect(readFitActivities({ rpe: 7 })).toEqual([])
    expect(readFitActivities({ coros: { activities: 'cassé' } })).toEqual([])
    expect(readFitActivities({ coros: { activities: [null, 42] } })).toEqual([])
  })
})

describe('computeRunning', () => {
  it('se déclare indisponible sans aucune course importée', () => {
    const result = computeRunning([session(3, [rowing])], periodStart, now)

    expect(result.available).toBe(false)
    expect(result.total_runs).toBe(0)
    expect(result.zones).toBeNull()
    expect(result.segments).toEqual([])
  })

  it('compte le volume sur la période et sur les deux fenêtres de 28 jours', () => {
    const result = computeRunning(
      [session(40, [run(8, 6)]), session(10, [run(5, 5.5)]), session(2, [run(6, 6)])],
      periodStart,
      now
    )

    expect(result.total_runs).toBe(3)
    expect(result.total_distance_km).toBe(19)
    expect(result.last_28_days_km).toBe(11)
    expect(result.previous_28_days_km).toBe(8)
  })

  it('pondère l’allure par la distance et compare les deux fenêtres', () => {
    const result = computeRunning(
      [
        session(50, [run(10, 6)]),
        session(35, [run(10, 6)]),
        // 10 km à 5:00 et 2 km à 6:00 : 62 min pour 12 km, soit 5,17 min/km (et non 5,5 en moyenne simple)
        session(15, [run(10, 5)]),
        session(5, [run(2, 6)]),
      ],
      periodStart,
      now
    )

    expect(result.previous_pace_min_km).toBe(6)
    expect(result.recent_pace_min_km).toBe(5.17)
    // Négatif : plus rapide qu'avant
    expect(result.pace_change_pct).toBe(-13.8)
  })

  it('ne donne pas de tendance d’allure sur une seule sortie', () => {
    const result = computeRunning([session(40, [run(8, 6)]), session(2, [run(6, 6)])], periodStart, now)

    expect(result.recent_pace_min_km).toBeNull()
    expect(result.pace_change_pct).toBeNull()
  })

  it('ignore les courses dont l’allure n’est pas exploitable', () => {
    const result = computeRunning([session(2, [run(0.1, 6), run(5, 30)])], periodStart, now)

    expect(result.available).toBe(false)
    expect(result.total_distance_km).toBe(0)
  })

  it('répartit le temps de course par zone cardiaque, sans compter les autres activités', () => {
    const result = computeRunning(
      [
        session(2, [
          run(5, 6, {
            hr_zones: [
              { zone: 2, label: 'Easy', seconds: 1500 },
              { zone: 4, label: 'Threshold', seconds: 300 },
            ],
          }),
          { ...rowing, hr_zones: [{ zone: 5, label: 'VO2 Max', seconds: 600 }] },
        ]),
        session(5, [run(5, 6, { hr_zones: [{ zone: 2, label: 'Easy', seconds: 600 }] })]),
      ],
      periodStart,
      now
    )

    expect(result.zones).toEqual([
      { zone: 2, label: 'Easy', share_pct: 88 },
      { zone: 4, label: 'Threshold', share_pct: 13 },
    ])
  })

  it('mesure l’écart d’allure entre les segments d’une séance à stations', () => {
    // Format Hyrox : course, rameur, course, rameur, course
    const result = computeRunning([session(2, [run(1, 5), rowing, run(1, 5.2), rowing, run(1, 5.5)])], periodStart, now)

    expect(result.segments).toEqual([
      {
        session_date: expect.any(String),
        kind: 'stations',
        paces_min_km: [5, 5.2, 5.5],
        spread_pct: 10,
        // L'ordre des fichiers n'est pas enregistré : pas de dérive du premier au dernier
        drift_pct: null,
      },
    ])
  })

  it('mesure la dérive sur les tours d’effort d’une sortie, sans l’échauffement ni la récupération', () => {
    const lap = (km: number, pace: number, intensity: string) => ({
      duration_seconds: km * pace * 60,
      distance_meters: km * 1000,
      intensity,
    })
    const result = computeRunning(
      [
        session(1, [
          run(6, 6, {
            laps: [
              lap(1, 7, 'warmup'),
              lap(1, 5, 'active'),
              lap(0.2, 8, 'recovery'),
              lap(1, 5.1, 'active'),
              lap(1, 5.4, 'active'),
              lap(1, 7, 'cooldown'),
            ],
          }),
        ]),
      ],
      periodStart,
      now
    )

    expect(result.segments).toEqual([
      {
        session_date: expect.any(String),
        kind: 'laps',
        paces_min_km: [5, 5.1, 5.4],
        spread_pct: 8,
        drift_pct: 8,
      },
    ])
  })

  it('n’analyse pas une sortie découpée en moins de 3 tours d’effort', () => {
    const result = computeRunning(
      [
        session(1, [
          run(2, 5, {
            laps: [
              { duration_seconds: 300, distance_meters: 1000, intensity: 'active' },
              { duration_seconds: 300, distance_meters: 1000, intensity: 'active' },
            ],
          }),
        ]),
      ],
      periodStart,
      now
    )

    expect(result.segments).toEqual([])
  })

  it('garde les 5 séances découpées les plus récentes, de la plus récente à la plus ancienne', () => {
    const stations = [run(1, 5), rowing, run(1, 5.5)]
    const result = computeRunning(
      [1, 2, 3, 4, 5, 6].map(daysAgo => session(daysAgo, stations)),
      periodStart,
      now
    )

    expect(result.segments).toHaveLength(5)
    expect(result.segments[0].session_date > result.segments[4].session_date).toBe(true)
  })

  it('exclut des totaux les séances antérieures à la période', () => {
    const result = computeRunning([session(120, [run(10, 6)])], periodStart, now)

    expect(result.available).toBe(false)
    expect(result.total_distance_km).toBe(0)
  })
})
