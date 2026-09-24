import type { Knex } from 'knex'

// Le bilan « global » (multi-sport) n'a plus de sens avec le CrossFit comme seul sport :
// son profil de condition physique est désormais produit par le bilan CrossFit.
export async function up(knex: Knex): Promise<void> {
  await knex('tracking_reports').where('sport', 'global').delete()
}

// Les bilans supprimés ne sont pas restaurables : ils seront régénérés à la demande.
export async function down(): Promise<void> {}
