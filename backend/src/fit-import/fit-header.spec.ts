import { BadRequestException } from '@nestjs/common'
import { assertValidFitHeader } from './fit-header'
import { FitImportService } from './fit-import.service'

/**
 * Fichier FIT minimal mais valide : en-tête de 14 octets, une définition du message « session »
 * (n° 18 du profil FIT) avec le champ total_elapsed_time (n° 7, uint32, en millisecondes),
 * une session de `durationSeconds`, puis 2 octets de CRC.
 */
function buildFitFile(durationSeconds: number): Buffer {
  const data = Buffer.from([
    // Définition : en-tête 0x40 (local 0), réservé, little-endian, message 18, 1 champ [n° 7, 4 octets, uint32]
    0x40, 0x00, 0x00, 18, 0x00, 1, 7, 4, 0x86,
    // Données : en-tête 0x00 (local 0), puis la durée en millisecondes
    0x00, 0, 0, 0, 0,
  ])
  data.writeUInt32LE(durationSeconds * 1000, 10)

  const header = Buffer.alloc(14)
  header[0] = 14
  header[1] = 0x10
  header.writeUInt16LE(2100, 2)
  header.writeUInt32LE(data.length, 4)
  header.write('.FIT', 8, 'latin1')

  return Buffer.concat([header, data, Buffer.alloc(2)])
}

/** Les attaques mesurées pendant l'analyse : chacune bloquait ou suspendait le serveur. */
function craftedHeader(): Buffer {
  const buffer = buildFitFile(60)
  buffer.writeUInt32LE(0x7fffffff, 4) // annonce 2 Go de données dans un fichier de quelques octets
  return buffer
}

describe('assertValidFitHeader', () => {
  it('accepte un fichier FIT bien formé', () => {
    expect(() => assertValidFitHeader(buildFitFile(3600))).not.toThrow()
  })

  it('accepte un fichier qui en enchaîne plusieurs (données en plus après le CRC)', () => {
    expect(() => assertValidFitHeader(Buffer.concat([buildFitFile(3600), buildFitFile(60)]))).not.toThrow()
  })

  it.each([
    ['un texte renommé en .fit', Buffer.from('ceci nest pas un fichier fit, juste du texte')],
    ['un fichier vide', Buffer.alloc(0)],
    ['un en-tête qui annonce plus de données que le fichier', craftedHeader()],
    ['une signature autre que .FIT', Buffer.from(buildFitFile(60)).fill('X', 8, 12)],
    ["une taille d'en-tête invalide", Buffer.from(buildFitFile(60)).fill(13, 0, 1)],
  ])('rejette %s', (_case, buffer) => {
    expect(() => assertValidFitHeader(buffer)).toThrow(BadRequestException)
  })
})

describe('FitImportService.parseFitFile', () => {
  const service = new FitImportService()

  it("extrait la durée d'un fichier FIT valide", async () => {
    await expect(service.parseFitFile(buildFitFile(3600))).resolves.toEqual(
      expect.objectContaining({ duration_seconds: 3600 })
    )
  })

  it.each([
    ['un texte renommé (bloquait le serveur ~9 s)', Buffer.from('ceci nest pas un fichier fit, juste du texte')],
    ['un en-tête piégé', craftedHeader()],
  ])('rejette %s en moins de 100 ms, sans bloquer le serveur', async (_case, buffer) => {
    const start = Date.now()

    await expect(service.parseFitFile(buffer)).rejects.toThrow(BadRequestException)
    expect(Date.now() - start).toBeLessThan(100)
  })

  it('renvoie 400 (et non 500) pour un en-tête correct mais un contenu corrompu', async () => {
    // En-tête cohérent, mais les données ne sont pas des messages FIT : la librairie rejette
    const corrupted = buildFitFile(60)
    corrupted.fill(0xff, 14, corrupted.length - 2)

    await expect(service.parseFitFile(corrupted)).rejects.toThrow('Fichier FIT invalide ou corrompu')
  })

  it("rejette tout l'envoi multiple si l'un des fichiers est corrompu", async () => {
    await expect(
      service.parseMultipleFitFiles([buildFitFile(3600), Buffer.from('pas un fichier fit')])
    ).rejects.toThrow(BadRequestException)
  })

  it("additionne les durées d'un envoi multiple", async () => {
    const result = await service.parseMultipleFitFiles([buildFitFile(1800), buildFitFile(600)])

    expect(result.activities).toHaveLength(2)
    expect(result.totals.duration_seconds).toBe(2400)
  })
})
