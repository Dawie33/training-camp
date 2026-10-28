import {
  ageFromDateOfBirth,
  computeHrZonesFromSamples,
  HrSample,
  MAX_SAMPLE_GAP_SECONDS,
  mergeHrZones,
  resolveMaxHr,
  zoneIndexFor,
  zonesFromDeviceTimeInZone,
} from './hr-zones'

const NOW = new Date('2026-10-26T12:00:00Z')

/** Points espacés de `stepSeconds`, à partir de t = 0. */
function samples(heartRates: number[], stepSeconds = 1): HrSample[] {
  return heartRates.map((heartRate, i) => ({ timestampMs: i * stepSeconds * 1000, heartRate }))
}

const secondsByZone = (zones: { seconds: number }[]) => zones.map(z => z.seconds)

describe('ageFromDateOfBirth', () => {
  it("compte les années révolues (anniversaire pas encore passé dans l'année)", () => {
    expect(ageFromDateOfBirth('1996-12-01', NOW)).toBe(29)
    expect(ageFromDateOfBirth('1996-01-15', NOW)).toBe(30)
  })

  it.each([
    ['absente', null],
    ['invalide', 'pas une date'],
    ['dans le futur', '2030-01-01'],
    ['improbable (plus de 100 ans)', '1900-01-01'],
  ])('renvoie null pour une date de naissance %s', (_case, value) => {
    expect(ageFromDateOfBirth(value, NOW)).toBeNull()
  })
})

describe('resolveMaxHr', () => {
  it('utilise en priorité la FC max du profil', () => {
    expect(resolveMaxHr({ profileMaxHr: 192, dateOfBirth: '1996-01-15', sessionMaxHr: 150, now: NOW })).toEqual({
      bpm: 192,
      source: 'profile',
    })
  })

  it('sans FC max au profil, estime 220 − âge', () => {
    expect(resolveMaxHr({ profileMaxHr: null, dateOfBirth: '1996-01-15', sessionMaxHr: 150, now: NOW })).toEqual({
      bpm: 190,
      source: 'age',
    })
  })

  it('ignore une FC max de profil invraisemblable (erreur de saisie) et passe à l’âge', () => {
    expect(resolveMaxHr({ profileMaxHr: 19, dateOfBirth: '1996-01-15', now: NOW })?.source).toBe('age')
    expect(resolveMaxHr({ profileMaxHr: 300, dateOfBirth: '1996-01-15', now: NOW })?.source).toBe('age')
  })

  it("en dernier recours, prend le max de la séance et l'indique", () => {
    expect(resolveMaxHr({ profileMaxHr: null, dateOfBirth: null, sessionMaxHr: 150, now: NOW })).toEqual({
      bpm: 150,
      source: 'session',
    })
  })

  it('renvoie null quand aucune référence n’est disponible', () => {
    expect(resolveMaxHr({ sessionMaxHr: 0, now: NOW })).toBeNull()
    expect(resolveMaxHr({ now: NOW })).toBeNull()
  })
})

describe('zoneIndexFor', () => {
  it.each([
    [100, 0], // 50 %
    [120, 1], // 60 % : borne basse de la zone 2
    [150, 2], // 75 %
    [170, 3], // 85 %
    [190, 4], // 95 %
    [210, 4], // au-dessus de la FC max : zone 5, pas d'index hors tableau
  ])('%i bpm (FC max 200) → index %i', (heartRate, expected) => {
    expect(zoneIndexFor(heartRate, 200)).toBe(expected)
  })
})

describe('computeHrZonesFromSamples', () => {
  it('classe une séance facile en zones basses quand la FC max est celle du profil (bug #47)', () => {
    // Séance qui plafonne à 150 bpm, athlète à 200 bpm de FC max : 150 bpm = 75 % = zone 3, pas zone 5
    const zones = computeHrZonesFromSamples(samples([110, 130, 150, 150, 150]), 200)

    expect(zones[4].seconds).toBe(0)
    expect(zones[2].seconds).toBeGreaterThan(0)
  })

  it('pondère chaque point par l’écart réel avec le point suivant (enregistrement intelligent)', () => {
    const records: HrSample[] = [
      { timestampMs: 0, heartRate: 100 }, // zone 1 pendant 10 s
      { timestampMs: 10_000, heartRate: 190 }, // zone 5 pendant 2 s
      { timestampMs: 12_000, heartRate: 190 }, // dernier point : 1 s
    ]

    expect(secondsByZone(computeHrZonesFromSamples(records, 200))).toEqual([10, 0, 0, 0, 3])
  })

  it('plafonne les trous (pause, capteur perdu) pour ne pas gonfler une zone', () => {
    const records: HrSample[] = [
      { timestampMs: 0, heartRate: 100 },
      { timestampMs: 600_000, heartRate: 100 }, // 10 min de pause
    ]

    expect(computeHrZonesFromSamples(records, 200)[0].seconds).toBe(MAX_SAMPLE_GAP_SECONDS + 1)
  })

  it('compte 1 s par point quand les horodatages manquent', () => {
    const records: HrSample[] = [
      { timestampMs: null, heartRate: 100 },
      { timestampMs: null, heartRate: 100 },
    ]

    expect(computeHrZonesFromSamples(records, 200)[0].seconds).toBe(2)
  })

  it('renvoie toujours 5 zones avec leurs bornes hautes en bpm', () => {
    const zones = computeHrZonesFromSamples(samples([150]), 190)

    expect(zones.map(z => z.zone)).toEqual([1, 2, 3, 4, 5])
    expect(zones.map(z => z.high_bpm)).toEqual([114, 133, 152, 171, 190])
  })
})

describe('zonesFromDeviceTimeInZone', () => {
  it('garde 5 zones telles quelles', () => {
    expect(secondsByZone(zonesFromDeviceTimeInZone([60, 120, 180, 240, 300], 190))).toEqual([60, 120, 180, 240, 300])
  })

  it('ramène plus de 5 valeurs à 5 zones, sans NaN (le surplus va en zone 1)', () => {
    // Format courant : [sous la zone 1, zone 1, …, zone 5]
    const zones = zonesFromDeviceTimeInZone([30, 60, 120, 180, 240, 300], 190)

    expect(zones).toHaveLength(5)
    expect(secondsByZone(zones)).toEqual([90, 120, 180, 240, 300])
    expect(zones.every(z => Number.isFinite(z.high_bpm))).toBe(true)
  })

  it('complète à 5 zones quand la montre en donne moins', () => {
    expect(secondsByZone(zonesFromDeviceTimeInZone([60, 120], 190))).toEqual([60, 120, 0, 0, 0])
  })
})

describe('mergeHrZones', () => {
  it('additionne les zones de plusieurs activités et retire les zones vides', () => {
    const a = computeHrZonesFromSamples(samples([100, 100]), 200)
    const b = computeHrZonesFromSamples(samples([100, 150]), 200)

    expect(mergeHrZones([a, null, b])?.map(z => [z.zone, z.seconds])).toEqual([
      [1, 3],
      [3, 1],
    ])
  })

  it('renvoie null sans zones', () => {
    expect(mergeHrZones([null, []])).toBeNull()
  })
})
