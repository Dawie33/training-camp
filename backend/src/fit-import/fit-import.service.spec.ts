import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { FitImportService, readStartTime, sortByStartTime } from './fit-import.service'

/**
 * Fichier FIT synthétique : des enregistrements cardio (message « record », n° 20 : timestamp + heart_rate)
 * espacés de `stepSeconds`, puis une session (n° 18 : total_elapsed_time + max_heart_rate).
 */
function buildFitFileWithHr(heartRates: number[], stepSeconds: number): Buffer {
  const parts: number[] = [
    // Définition locale 0 : record, 2 champs [253 timestamp uint32] [3 heart_rate uint8]
    0x40, 0x00, 0x00, 20, 0x00, 2, 253, 4, 0x86, 3, 1, 0x02,
  ]
  heartRates.forEach((hr, i) => {
    const timestamp = Buffer.alloc(4)
    timestamp.writeUInt32LE(1_000_000_000 + i * stepSeconds)
    parts.push(0x00, ...timestamp, hr)
  })

  // Définition locale 1 : session, 2 champs [7 total_elapsed_time uint32 (ms)] [17 max_heart_rate uint8]
  parts.push(0x41, 0x00, 0x00, 18, 0x00, 2, 7, 4, 0x86, 17, 1, 0x02)
  const elapsed = Buffer.alloc(4)
  elapsed.writeUInt32LE(heartRates.length * stepSeconds * 1000)
  parts.push(0x01, ...elapsed, Math.max(...heartRates))

  const data = Buffer.from(parts)
  const header = Buffer.alloc(14)
  header[0] = 14
  header[1] = 0x10
  header.writeUInt16LE(2100, 2)
  header.writeUInt32LE(data.length, 4)
  header.write('.FIT', 8, 'latin1')

  return Buffer.concat([header, data, Buffer.alloc(2)])
}

/** Entête FIT de 14 octets + données + CRC vide, comme le produit une montre. */
function wrapFitData(parts: number[]): Buffer {
  const data = Buffer.from(parts)
  const header = Buffer.alloc(14)
  header[0] = 14
  header[1] = 0x10
  header.writeUInt16LE(2100, 2)
  header.writeUInt32LE(data.length, 4)
  header.write('.FIT', 8, 'latin1')
  return Buffer.concat([header, data, Buffer.alloc(2)])
}

const uint32 = (value: number) => {
  const bytes = Buffer.alloc(4)
  bytes.writeUInt32LE(value)
  return [...bytes]
}

/**
 * Course découpée par la montre : une fraction de 400 m en 2:10 puis une récupération de 210 m en 1:30
 * (messages « lap », n° 19), suivies de la session (n° 18).
 */
function buildFitFileWithLaps(): Buffer {
  const start = 1_000_000_000
  const parts: number[] = [
    // Définition locale 0 : lap — timestamp, start_time, total_elapsed_time, total_timer_time (ms),
    // total_distance (cm), avg_heart_rate, max_heart_rate, intensity, lap_trigger
    0x40, 0x00, 0x00, 19, 0x00, 9, 253, 4, 0x86, 2, 4, 0x86, 7, 4, 0x86, 8, 4, 0x86, 9, 4, 0x86, 15, 1, 0x02, 16, 1,
    0x02, 23, 1, 0x00, 24, 1, 0x00,
  ]
  const lap = (from: number, seconds: number, meters: number, avgHr: number, maxHr: number, intensity: number) =>
    parts.push(
      0x00,
      ...uint32(from + seconds),
      ...uint32(from),
      ...uint32(seconds * 1000),
      ...uint32(seconds * 1000),
      ...uint32(meters * 100),
      avgHr,
      maxHr,
      intensity,
      0
    )
  lap(start, 130, 400, 168, 176, 0) // intensity 0 = active
  lap(start + 130, 90, 210, 150, 165, 1) // intensity 1 = rest

  // Définition locale 1 : session — timestamp, start_time, total_elapsed_time, total_distance, sport (1 = running)
  parts.push(0x41, 0x00, 0x00, 18, 0x00, 5, 253, 4, 0x86, 2, 4, 0x86, 7, 4, 0x86, 9, 4, 0x86, 5, 1, 0x00)
  parts.push(0x01, ...uint32(start + 220), ...uint32(start), ...uint32(220 * 1000), ...uint32(610 * 100), 1)

  return wrapFitData(parts)
}

// Séance facile qui plafonne à 150 bpm : 10 points espacés de 5 s (enregistrement « intelligent »)
const EASY_SESSION = buildFitFileWithHr([110, 120, 130, 140, 150, 150, 150, 150, 150, 150], 5)

describe('FitImportService.parseMultipleFitFiles — zones cardiaques', () => {
  let first: jest.Mock

  async function buildService(profile: { max_heart_rate: number | null; dateOfBirth: string | null } | undefined) {
    first = jest.fn().mockResolvedValue(profile)
    const knexMock = jest.fn(() => ({ where: jest.fn().mockReturnThis(), first }))
    const moduleRef = await Test.createTestingModule({
      providers: [FitImportService, { provide: getConnectionToken(), useValue: knexMock }],
    }).compile()
    return { service: moduleRef.get(FitImportService), knexMock }
  }

  it('lit la FC max et la date de naissance du profil de l’utilisateur connecté', async () => {
    const { service, knexMock } = await buildService({ max_heart_rate: 200, dateOfBirth: null })

    await service.parseMultipleFitFiles([EASY_SESSION], 'user-1')

    expect(knexMock).toHaveBeenCalledWith('users')
    expect(first).toHaveBeenCalledWith(['max_heart_rate', 'dateOfBirth'])
  })

  it('calcule les zones sur la FC max du profil : 150 bpm sur 200 reste en zone 3 (bug #47)', async () => {
    const { service } = await buildService({ max_heart_rate: 200, dateOfBirth: null })

    const { totals } = await service.parseMultipleFitFiles([EASY_SESSION], 'user-1')

    expect(totals.hr_max_reference).toEqual({ bpm: 200, source: 'profile' })
    expect(totals.hr_zones?.map(z => z.zone)).toEqual([1, 2, 3])
    expect(totals.hr_zones?.find(z => z.zone === 5)).toBeUndefined()
  })

  it('pondère par l’écart entre enregistrements : 10 points à 5 s ≈ 46 s, pas 10 s', async () => {
    const { service } = await buildService({ max_heart_rate: 200, dateOfBirth: null })

    const { totals } = await service.parseMultipleFitFiles([EASY_SESSION], 'user-1')

    // 9 écarts de 5 s + 1 s pour le dernier point
    expect(totals.hr_zones?.reduce((s, z) => s + z.seconds, 0)).toBe(46)
  })

  it('sans FC max au profil, utilise 220 − âge', async () => {
    const { service } = await buildService({ max_heart_rate: null, dateOfBirth: '1990-01-01' })

    const { totals } = await service.parseMultipleFitFiles([EASY_SESSION], 'user-1')

    expect(totals.hr_max_reference?.source).toBe('age')
  })

  it("sans FC max ni âge, se rabat sur le max de la séance et l'indique (zones surestimées)", async () => {
    const { service } = await buildService({ max_heart_rate: null, dateOfBirth: null })

    const { totals } = await service.parseMultipleFitFiles([EASY_SESSION], 'user-1')

    expect(totals.hr_max_reference).toEqual({ bpm: 150, source: 'session' })
    expect(totals.hr_zones?.find(z => z.zone === 5)?.seconds).toBeGreaterThan(0)
  })
})

describe('FitImportService.parseMultipleFitFiles — tours', () => {
  it('enregistre chaque fraction et chaque récupération découpées par la montre', async () => {
    // Arrange
    const knexMock = jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(undefined),
    }))
    const moduleRef = await Test.createTestingModule({
      providers: [FitImportService, { provide: getConnectionToken(), useValue: knexMock }],
    }).compile()
    const service = moduleRef.get(FitImportService)

    // Act
    const { activities } = await service.parseMultipleFitFiles([buildFitFileWithLaps()], 'user-1')

    // Assert — noms de champs et unités de fit-file-parser : secondes, mètres, intensité en texte
    expect(activities[0].laps).toEqual([
      {
        index: 1,
        duration_seconds: 130,
        distance_meters: 400,
        avg_pace_min_km: 5.42,
        avg_heart_rate: 168,
        max_heart_rate: 176,
        intensity: 'active',
      },
      {
        index: 2,
        duration_seconds: 90,
        distance_meters: 210,
        avg_pace_min_km: 7.14,
        avg_heart_rate: 150,
        max_heart_rate: 165,
        intensity: 'rest',
      },
    ])
  })

  it("n'enregistre aucun tour pour une activité que la montre n'a pas découpée", async () => {
    const knexMock = jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(undefined),
    }))
    const moduleRef = await Test.createTestingModule({
      providers: [FitImportService, { provide: getConnectionToken(), useValue: knexMock }],
    }).compile()

    const { activities } = await moduleRef.get(FitImportService).parseMultipleFitFiles([EASY_SESSION], 'user-1')

    expect(activities[0].laps).toEqual([])
  })
})

describe('readStartTime', () => {
  it('renvoie l’heure de départ au format ISO', () => {
    expect(readStartTime(new Date('2026-06-16T08:00:00.000Z'))).toBe('2026-06-16T08:00:00.000Z')
    expect(readStartTime('2026-06-16T08:00:00Z')).toBe('2026-06-16T08:00:00.000Z')
  })

  it('renvoie null quand la montre ne l’a pas écrite ou qu’elle est illisible', () => {
    expect(readStartTime(undefined)).toBeNull()
    expect(readStartTime('pas une date')).toBeNull()
    expect(readStartTime({})).toBeNull()
  })
})

describe('sortByStartTime', () => {
  const at = (time: string | null, sport: string) => ({ start_time: time, sport })

  it('remet les activités dans l’ordre où elles ont été faites, pas dans l’ordre de sélection des fichiers', () => {
    const sorted = sortByStartTime([
      at('2026-06-16T08:10:00.000Z', 'rowing'),
      at('2026-06-16T08:00:00.000Z', 'running'),
      at('2026-06-16T08:15:00.000Z', 'running'),
    ])

    expect(sorted.map(a => a.start_time)).toEqual([
      '2026-06-16T08:00:00.000Z',
      '2026-06-16T08:10:00.000Z',
      '2026-06-16T08:15:00.000Z',
    ])
  })

  it('garde l’ordre d’envoi si une heure manque, plutôt que de deviner', () => {
    const activities = [at('2026-06-16T08:10:00.000Z', 'rowing'), at(null, 'running')]

    expect(sortByStartTime(activities)).toEqual(activities)
  })
})
