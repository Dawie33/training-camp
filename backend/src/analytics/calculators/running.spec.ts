import {
  classifyRunSession,
  computeRunning,
  FitActivityInput,
  isIntervalRun,
  readFitActivities,
  readHyroxSimulation,
  RunningSessionInput,
  segmentPace,
} from './running'

const now = new Date('2026-10-30T18:00:00.000Z')
const periodStart = new Date('2026-07-30T18:00:00.000Z')

/** Sortie de course : `km` kilomètres à `pace` min/km. */
function run(km: number, pace: number, extra: Partial<FitActivityInput> = {}): FitActivityInput {
  return {
    start_time: null,
    sport: 'running',
    duration_seconds: km * pace * 60,
    distance_meters: km * 1000,
    hr_zones: null,
    laps: [],
    ...extra,
  }
}

const rowing: FitActivityInput = {
  start_time: null,
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
        start_time: null,
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

/** Tour de montre : `km` kilomètres à `pace` min/km. */
const lap = (km: number, pace: number, intensity: string | null = null) => ({
  duration_seconds: km * pace * 60,
  distance_meters: km * 1000,
  intensity,
})

/** Heure de départ, `minutes` après 8 h le jour de la séance. */
const startAt = (minutes: number) => new Date(Date.UTC(2026, 9, 28, 8, minutes)).toISOString()

describe('isIntervalRun', () => {
  it('ne prend pas un footing en tours automatiques de 1 km pour un fractionné', () => {
    // Sortie du 30/10 : de 7:04 à 7:33 /km, puis un bout de 155 m
    const easy = run(6.2, 7.3, {
      laps: [lap(1, 7.17), lap(1, 7.14), lap(1, 7.07), lap(1, 7.36), lap(1, 7.52), lap(1, 7.55), lap(0.16, 7.77)],
    })

    expect(isIntervalRun(easy)).toBe(false)
  })

  it('reconnaît un fractionné marqué par la montre', () => {
    expect(isIntervalRun(run(5, 5, { laps: [lap(0.4, 4.5, 'active'), lap(0.2, 9, 'recovery')] }))).toBe(true)
  })

  it('reconnaît un fractionné non marqué à l’écart d’allure entre tours', () => {
    // 400 m à 4:30 et 200 m de récupération en marchant à 10:00
    const laps = [lap(0.4, 4.5), lap(0.2, 10), lap(0.4, 4.5), lap(0.2, 10)]

    expect(isIntervalRun(run(1.2, 6, { laps }))).toBe(true)
  })

  it('compte comme continue une sortie importée sans tours', () => {
    expect(isIntervalRun(run(7, 6.7))).toBe(false)
  })
})

describe('classifyRunSession', () => {
  it('distingue séance à stations, fractionné et sortie continue', () => {
    expect(classifyRunSession(session(1, [run(1, 5), rowing, run(1, 5)]))).toBe('stations')
    expect(classifyRunSession(session(1, [run(5, 5, { laps: [lap(0.4, 4.5, 'interval')] })]))).toBe('intervals')
    expect(classifyRunSession(session(1, [run(6, 6)]))).toBe('continuous')
    // Une seule course avant une séance de rameur : rien à comparer entre segments
    expect(classifyRunSession(session(1, [run(2, 5), rowing]))).toBe('continuous')
  })
})

describe('computeRunning — types de sortie', () => {
  const intervals = run(5, 4.5, { laps: [lap(0.4, 4, 'interval'), lap(0.2, 9, 'recovery')] })

  it('compte les séances des 28 derniers jours par type', () => {
    const result = computeRunning(
      [
        session(40, [run(8, 6)]),
        session(10, [run(5, 6)]),
        session(8, [intervals]),
        session(3, [run(1, 5), rowing, run(1, 5.2)]),
        session(1, [run(6, 6)]),
      ],
      periodStart,
      now
    )

    expect(result.run_types).toEqual({ continuous: 2, intervals: 1, stations: 1 })
  })

  it('ne calcule l’allure moyenne que sur les sorties continues', () => {
    const result = computeRunning(
      [
        session(10, [run(5, 6)]),
        session(8, [intervals]),
        session(3, [run(1, 4.8), rowing, run(1, 5)]),
        session(1, [run(5, 6)]),
      ],
      periodStart,
      now
    )

    // Avec le fractionné et les segments à stations, la moyenne tomberait sous 5:30
    expect(result.recent_pace_min_km).toBe(6)
    // Le volume, lui, compte toutes les courses
    expect(result.last_28_days_km).toBe(17)
  })
})

describe('computeRunning — ordre des segments à stations', () => {
  it('mesure la dérive dans l’ordre réel des courses quand chaque fichier a son heure de départ', () => {
    // Fichiers sélectionnés dans le désordre : le dernier km couru (5:30) est envoyé en premier
    const result = computeRunning(
      [
        session(2, [
          run(1, 5.5, { start_time: startAt(20) }),
          { ...rowing, start_time: startAt(6) },
          run(1, 5, { start_time: startAt(0) }),
          run(1, 5.2, { start_time: startAt(10) }),
        ]),
      ],
      periodStart,
      now
    )

    expect(result.segments[0]).toMatchObject({ kind: 'stations', paces_min_km: [5, 5.2, 5.5], drift_pct: 10 })
  })
})

describe('readHyroxSimulation', () => {
  /** Simulation : un km de course puis une station de `stationSeconds`, `segments` fois. */
  const simulation = (segments: number, pace: number, stationSeconds: number, daysAgo = 2) =>
    session(
      daysAgo,
      Array.from({ length: segments }, (_, i) => [
        run(1, pace + i * 0.1, { start_time: startAt(i * 10) }),
        { ...rowing, duration_seconds: stationSeconds, start_time: startAt(i * 10 + 5) },
      ]).flat()
    )

  it('reconnaît une simulation complète et sépare temps de course et temps aux stations', () => {
    // 8 km de 5:00 à 5:42 /km, 8 stations de 4 min
    const found = readHyroxSimulation(simulation(8, 5, 240))

    expect(found?.run_segments).toBe(8)
    expect(found?.simulation).toMatchObject({
      total_seconds: 4488,
      run_seconds: 2568,
      station_seconds: 1920,
      run_share_pct: 57,
      run_drift_pct: 14,
    })
  })

  it('n’en voit pas dans une échelle de distances, ni sous 4 segments', () => {
    const ladder = session(2, [run(1, 5), rowing, run(0.8, 5), rowing, run(0.6, 5), rowing, run(0.4, 5), rowing])

    expect(readHyroxSimulation(ladder)).toBeNull()
    expect(readHyroxSimulation(simulation(3, 5, 240))).toBeNull()
  })

  it('écarte une simulation dont une station n’a pas de durée : son temps total serait faux', () => {
    const sim = simulation(4, 5, 240)
    sim.activities[1] = { ...sim.activities[1], duration_seconds: null }

    expect(readHyroxSimulation(sim)).toBeNull()
  })
})

describe('computeRunning — simulations Hyrox', () => {
  const simulation = (segments: number, stationSeconds: number, daysAgo: number) =>
    session(
      daysAgo,
      Array.from({ length: segments }, () => [run(1, 5), { ...rowing, duration_seconds: stationSeconds }]).flat()
    )

  it('compare chaque simulation à la précédente du même format seulement, sans limite de période', () => {
    const result = computeRunning(
      [
        // Simulation complète il y a 200 jours, hors période : elle sert quand même de point de comparaison
        simulation(8, 300, 200),
        simulation(8, 240, 5),
        simulation(4, 200, 20),
      ],
      periodStart,
      now
    )

    expect(result.hyrox_simulations.map(s => [s.format, s.count])).toEqual([
      ['8 × 1 km', 2],
      ['4 × 1 km', 1],
    ])
    // 8 × (300 + 300 s) = 4800 s, puis 8 × (300 + 240 s) = 4320 s
    expect(result.hyrox_simulations[0].previous?.total_seconds).toBe(4800)
    expect(result.hyrox_simulations[0].delta_pct).toBe(-10)
    // La demi-simulation ne se compare pas à la complète
    expect(result.hyrox_simulations[1].previous).toBeNull()
    expect(result.hyrox_simulations[1].delta_pct).toBeNull()
  })
})
