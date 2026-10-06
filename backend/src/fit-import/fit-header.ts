import { BadRequestException } from '@nestjs/common'

const VALID_HEADER_SIZES = [12, 14]
const FIT_SIGNATURE = '.FIT'
const FILE_CRC_SIZE = 2

/**
 * Vérifie la structure d'un fichier FIT avant de le confier à fit-file-parser.
 *
 * La librairie croit la taille de données annoncée dans l'en-tête et boucle jusqu'à elle, même si
 * le fichier est bien plus petit : un simple texte renommé en .fit bloquait le serveur ~9 s
 * (et toute l'API avec, Node n'ayant qu'un fil d'exécution). Son option `force: false` n'est pas
 * une solution : elle s'arrête alors sans jamais répondre.
 *
 * Structure : [taille en-tête (12|14)] … [taille des données, uint32 LE, octets 4-7]
 * [".FIT", octets 8-11] … puis les données et 2 octets de CRC.
 *
 * @throws {BadRequestException} Si le fichier n'a pas une structure FIT cohérente.
 */
export function assertValidFitHeader(buffer: Buffer): void {
  const headerSize = buffer[0]
  const isValid =
    buffer.length >= 12 &&
    VALID_HEADER_SIZES.includes(headerSize) &&
    buffer.toString('latin1', 8, 12) === FIT_SIGNATURE &&
    // « au moins » : certaines montres enchaînent plusieurs fichiers FIT dans un seul
    headerSize + buffer.readUInt32LE(4) + FILE_CRC_SIZE <= buffer.length

  if (!isValid) {
    throw new BadRequestException('Fichier FIT invalide ou corrompu')
  }
}
