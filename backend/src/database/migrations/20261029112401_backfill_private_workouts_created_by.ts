import type { Knex } from 'knex'

/**
 * Jusqu'ici, `POST /workouts` n'enregistrait pas l'auteur : les workouts privés créés depuis
 * l'interface (WOD collés, WOD générés) ont `created_by_user_id = NULL`. La nouvelle règle de
 * visibilité (privé = visible par son seul auteur) les rendrait invisibles pour tout le monde,
 * y compris pour leur créateur. On retrouve donc l'auteur quand la base permet de le déduire :
 * 1. un seul utilisateur a planifié ou enregistré le workout → c'est lui ;
 * 2. sinon, un seul compte existait à la création du workout → c'est lui.
 * Les autres restent sans auteur : impossible de savoir à qui ils sont.
 *
 * Irréversible : le down ne remet pas les auteurs à NULL. Il rendrait ces workouts invisibles
 * à leur auteur, et ne distinguerait pas les lignes déduites ici de celles écrites depuis par l'API.
 */
export async function up(knex: Knex): Promise<void> {
  const fromLinks = await knex.raw(`
    WITH linked AS (
      SELECT workout_id, min(user_id::text)::uuid AS user_id
      FROM (
        SELECT workout_id, user_id FROM user_workout_schedule WHERE workout_id IS NOT NULL
        UNION
        SELECT workout_id, user_id FROM workout_sessions WHERE workout_id IS NOT NULL
      ) AS links
      GROUP BY workout_id
      HAVING count(DISTINCT user_id) = 1
    )
    UPDATE workouts AS w
    SET created_by_user_id = linked.user_id
    FROM linked
    WHERE w.id = linked.workout_id
      AND w."isPublic" = false
      AND w.created_by_user_id IS NULL
  `)

  const fromSoleAccount = await knex.raw(`
    UPDATE workouts AS w
    SET created_by_user_id = (SELECT u.id FROM users AS u WHERE u.created_at <= w.created_at)
    WHERE w."isPublic" = false
      AND w.created_by_user_id IS NULL
      AND (SELECT count(*) FROM users AS u WHERE u.created_at <= w.created_at) = 1
  `)

  const remaining = await knex('workouts')
    .where({ isPublic: false })
    .whereNull('created_by_user_id')
    .count({ count: '*' })
    .first()

  console.warn(
    `[workouts] auteur retrouvé : ${fromLinks.rowCount} par planification ou séance, ` +
      `${fromSoleAccount.rowCount} par compte unique ; ${remaining?.count ?? 0} workout(s) privé(s) restent sans auteur`
  )
}

export async function down(): Promise<void> {
  // Volontairement vide : voir le commentaire en tête de fichier
}
