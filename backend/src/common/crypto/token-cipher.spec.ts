import { randomBytes } from 'crypto'
import { decryptToken, encryptToken, isEncryptedToken, parseEncryptionKey } from './token-cipher'

// Clés générées à chaque exécution : aucune clé réelle dans les tests
const key = randomBytes(32)
const otherKey = randomBytes(32)

describe('token-cipher', () => {
  describe('encryptToken / decryptToken', () => {
    it('retrouve la valeur d’origine après chiffrement puis déchiffrement', () => {
      const encrypted = encryptToken('1//refresh-token-google', key)

      expect(decryptToken(encrypted, key)).toBe('1//refresh-token-google')
    })

    it('ne laisse pas apparaître la valeur en clair et utilise le format v1', () => {
      const encrypted = encryptToken('1//refresh-token-google', key)

      expect(encrypted).not.toContain('refresh-token-google')
      expect(encrypted.split(':')).toHaveLength(4)
      expect(isEncryptedToken(encrypted)).toBe(true)
    })

    it('produit un résultat différent à chaque fois (IV aléatoire)', () => {
      expect(encryptToken('même-token', key)).not.toBe(encryptToken('même-token', key))
    })

    it('gère les caractères non ASCII', () => {
      expect(decryptToken(encryptToken('jeton-é-✓', key), key)).toBe('jeton-é-✓')
    })

    it('refuse de déchiffrer avec une autre clé', () => {
      const encrypted = encryptToken('refresh-token', key)

      expect(() => decryptToken(encrypted, otherKey)).toThrow()
    })

    it('détecte une valeur modifiée en base (tag GCM)', () => {
      const [version, iv, tag, data] = encryptToken('refresh-token', key).split(':')
      const tampered = Buffer.from(data, 'base64')
      tampered[0] ^= 0xff

      expect(() => decryptToken([version, iv, tag, tampered.toString('base64')].join(':'), key)).toThrow()
    })

    it('refuse un tag d’authentification tronqué', () => {
      const [version, iv, tag, data] = encryptToken('refresh-token', key).split(':')
      const shortTag = Buffer.from(tag, 'base64').subarray(0, 4).toString('base64')

      expect(() => decryptToken([version, iv, shortTag, data].join(':'), key)).toThrow()
    })

    it.each(['token-en-clair', 'v1:abc', 'v2:a:b:c'])('refuse le format invalide « %s »', value => {
      expect(() => decryptToken(value, key)).toThrow('Format de token chiffré invalide')
    })
  })

  describe('isEncryptedToken', () => {
    it('reconnaît un ancien token Google stocké en clair', () => {
      expect(isEncryptedToken('1//0gAbCdEf-ancien-token')).toBe(false)
    })
  })

  describe('parseEncryptionKey', () => {
    it('accepte 64 caractères hexadécimaux et renvoie 32 octets', () => {
      expect(parseEncryptionKey(key.toString('hex'))).toEqual(key)
    })

    it.each([
      ['trop courte', 'ab'.repeat(16)],
      ['non hexadécimale', 'z'.repeat(64)],
      ['vide', ''],
    ])('refuse une clé %s', (_case, value) => {
      expect(() => parseEncryptionKey(value)).toThrow()
    })
  })
})
