import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { FitImportService } from './fit-import.service'

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
