import type { Knex } from 'knex'
import { decryptToken, encryptToken, isEncryptedToken, parseEncryptionKey } from '../../common/crypto/token-cipher'

// Migration de données : chiffre les refresh_token Google enregistrés en clair avant le chiffrement applicatif.
// Elle lit TOKEN_ENCRYPTION_KEY dans l'environnement (chargé par le knexfile) : ce doit être la même clé que l'API.

async function findTokens(knex: Knex): Promise<{ id: string; google_refresh_token: string }[]> {
  return knex('users').whereNotNull('google_refresh_token').select('id', 'google_refresh_token')
}

function getKey(count: number): Buffer {
  const hexKey = process.env.TOKEN_ENCRYPTION_KEY
  if (!hexKey) {
    throw new Error(
      `${count} refresh_token Google à traiter : définir TOKEN_ENCRYPTION_KEY avant de relancer la migration.`
    )
  }
  return parseEncryptionKey(hexKey)
}

export async function up(knex: Knex): Promise<void> {
  const plainRows = (await findTokens(knex)).filter(row => !isEncryptedToken(row.google_refresh_token))
  if (plainRows.length === 0) return

  const key = getKey(plainRows.length)
  await knex.transaction(async trx => {
    for (const row of plainRows) {
      await trx('users')
        .where({ id: row.id })
        .update({ google_refresh_token: encryptToken(row.google_refresh_token, key) })
    }
  })
}

export async function down(knex: Knex): Promise<void> {
  // Remet les tokens en clair : nécessaire pour revenir à une version du code qui ne sait pas déchiffrer.
  const encryptedRows = (await findTokens(knex)).filter(row => isEncryptedToken(row.google_refresh_token))
  if (encryptedRows.length === 0) return

  const key = getKey(encryptedRows.length)
  await knex.transaction(async trx => {
    for (const row of encryptedRows) {
      await trx('users')
        .where({ id: row.id })
        .update({ google_refresh_token: decryptToken(row.google_refresh_token, key) })
    }
  })
}
