import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

/**
 * Chiffrement des secrets stockés en base (ex. refresh_token Google) avec AES-256-GCM.
 *
 * - AES-256 : la clé fait 32 octets (64 caractères hexadécimaux dans TOKEN_ENCRYPTION_KEY).
 * - GCM : en plus de chiffrer, produit un « tag d'authentification ». Au déchiffrement, une valeur
 *   modifiée ou une mauvaise clé est détectée (exception) au lieu de renvoyer des octets aléatoires.
 * - IV (vecteur d'initialisation) aléatoire à chaque chiffrement : deux tokens identiques ne donnent
 *   jamais le même texte chiffré. Il n'est pas secret, on le stocke avec la valeur.
 *
 * Format stocké : `v1:<iv>:<tag>:<texte chiffré>`, chaque partie en base64.
 * Le préfixe de version permettra de changer d'algorithme plus tard sans casser l'existant.
 */

const ALGORITHM = 'aes-256-gcm'
const FORMAT_VERSION = 'v1'
const KEY_LENGTH_BYTES = 32
// 12 octets : taille d'IV recommandée pour GCM
const IV_LENGTH_BYTES = 12
const AUTH_TAG_LENGTH_BYTES = 16

/** Convertit la clé hexadécimale de l'environnement en Buffer de 32 octets. */
export function parseEncryptionKey(hexKey: string): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(hexKey)) {
    throw new Error(`La clé de chiffrement doit faire ${KEY_LENGTH_BYTES * 2} caractères hexadécimaux`)
  }
  return Buffer.from(hexKey, 'hex')
}

/** La valeur a-t-elle le format produit par encryptToken ? (sinon : ancien token stocké en clair) */
export function isEncryptedToken(value: string): boolean {
  return value.startsWith(`${FORMAT_VERSION}:`)
}

export function encryptToken(plainText: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH_BYTES })
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [FORMAT_VERSION, iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':')
}

/**
 * @throws {Error} Si la valeur n'a pas le bon format, a été modifiée, ou si la clé n'est pas la bonne.
 * Le message d'erreur ne contient jamais la valeur elle-même.
 */
export function decryptToken(stored: string, key: Buffer): string {
  const parts = stored.split(':')
  if (parts.length !== 4 || parts[0] !== FORMAT_VERSION) {
    throw new Error('Format de token chiffré invalide')
  }
  const [iv, tag, encrypted] = parts.slice(1).map(part => Buffer.from(part, 'base64'))

  // authTagLength fixé : un tag tronqué (plus facile à deviner) est refusé
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH_BYTES })
  decipher.setAuthTag(tag)
  // final() lève une exception si le tag ne correspond pas (valeur altérée ou mauvaise clé)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
