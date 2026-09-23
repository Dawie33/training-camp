import type { Knex } from 'knex'

/**
 * Reprend l'historique des séances de force dans `workout_sessions`, puis supprime la
 * table dédiée : le travail de force n'est plus un module séparé, c'est un bloc de
 * séance CrossFit.
 *
 * Chaque `strength_session` devient :
 *  - un `personalized_workout` dont le plan porte une section de type `strength`,
 *  - une `workout_session` dont les `results` suivent le contrat structuré
 *    (`exercise_results`, `rpe`), pour rester analysable par le module analytics.
 *
 * Les séries de `sets_logged` sont agrégées par exercice — une entrée par mouvement,
 * la charge retenue étant la plus lourde travaillée, comme dans le log CrossFit.
 */

interface LoggedSet {
  exercise_name?: string
  reps?: number
  weight_kg?: number
}

interface StrengthSessionRow {
  id: string
  user_id: string
  session_date: string
  target_muscles: string[] | null
  session_goal: string
  source: string
  ai_plan: unknown
  sets_logged: unknown
  perceived_effort: number | null
  duration_minutes: number | null
  notes: string | null
  status: string
  body_focus: string | null
  training_style: string | null
  created_at: string
}

const GOAL_LABELS: Record<string, string> = {
  strength: 'Force',
  hypertrophy: 'Hypertrophie',
  endurance: 'Endurance musculaire',
  power: 'Puissance',
}

function buildExerciseResults(setsLogged: unknown): {
  name: string
  section_type: string
  load_kg?: number
  reps_completed?: number
  sets_completed: number
  scaled: boolean
}[] {
  if (!Array.isArray(setsLogged)) return []

  const byExercise = new Map<string, { name: string; loads: number[]; reps: number; sets: number }>()

  for (const raw of setsLogged) {
    if (typeof raw !== 'object' || raw === null) continue
    const set = raw as LoggedSet
    const name = typeof set.exercise_name === 'string' ? set.exercise_name.trim() : ''
    if (!name) continue

    const acc = byExercise.get(name) ?? { name, loads: [], reps: 0, sets: 0 }
    acc.sets += 1
    if (typeof set.reps === 'number' && set.reps > 0) acc.reps += set.reps
    if (typeof set.weight_kg === 'number' && set.weight_kg > 0) acc.loads.push(set.weight_kg)
    byExercise.set(name, acc)
  }

  return [...byExercise.values()].map(acc => ({
    name: acc.name,
    section_type: 'strength',
    ...(acc.loads.length > 0 ? { load_kg: Math.max(...acc.loads) } : {}),
    ...(acc.reps > 0 ? { reps_completed: acc.reps } : {}),
    sets_completed: acc.sets,
    scaled: false,
  }))
}

function buildPlanJson(row: StrengthSessionRow, exerciseResults: ReturnType<typeof buildExerciseResults>) {
  const goalLabel = GOAL_LABELS[row.session_goal] ?? 'Force'
  const muscles = Array.isArray(row.target_muscles) ? row.target_muscles.join(', ') : ''
  const name = muscles ? `Force — ${goalLabel} (${muscles})` : `Force — ${goalLabel}`

  return {
    name,
    workout_type: 'strength',
    // Conservé tel quel : le plan d'origine reste consultable même si sa forme diffère
    legacy_strength_plan: row.ai_plan ?? null,
    blocks: {
      sections: [
        {
          type: 'strength',
          title: goalLabel,
          ...(row.duration_minutes ? { duration_min: row.duration_minutes } : {}),
          exercises: exerciseResults.map(result => ({
            name: result.name,
            ...(result.sets_completed ? { sets: result.sets_completed } : {}),
            ...(result.reps_completed ? { reps: result.reps_completed } : {}),
            ...(result.load_kg ? { weight: `${result.load_kg}kg` } : {}),
          })),
        },
      ],
    },
  }
}

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('strength_sessions')
  if (!hasTable) return

  // `pg` convertit une colonne DATE en objet Date : on la relit en texte YYYY-MM-DD pour
  // pouvoir reconstituer l'horodatage de la séance sans dépendre du fuseau du serveur.
  const rows: StrengthSessionRow[] = await knex('strength_sessions')
    .select('*', knex.raw(`to_char(session_date, 'YYYY-MM-DD') as session_date`))
    .orderBy('strength_sessions.session_date', 'asc')

  for (const row of rows) {
    const exerciseResults = buildExerciseResults(row.sets_logged)

    const [personalized] = await knex('personalized_workouts')
      .insert({
        user_id: row.user_id,
        wod_date: row.session_date,
        plan_json: JSON.stringify(buildPlanJson(row, exerciseResults)),
        params_json: JSON.stringify({
          migrated_from: 'strength_sessions',
          original_id: row.id,
          session_goal: row.session_goal,
          target_muscles: row.target_muscles ?? [],
          body_focus: row.body_focus,
          training_style: row.training_style,
          source: row.source,
        }),
        created_at: row.created_at,
      })
      .returning('id')

    const personalizedId = typeof personalized === 'object' ? personalized.id : personalized

    // Une séance de force n'a pas de chrono : on reconstitue un créneau à partir de sa durée.
    const startedAt = new Date(`${row.session_date}T12:00:00.000Z`)
    const durationSeconds = (row.duration_minutes ?? 0) * 60
    const completedAt = row.status === 'completed'
      ? new Date(startedAt.getTime() + durationSeconds * 1000)
      : null

    const results: Record<string, unknown> = {
      session_title: buildPlanJson(row, exerciseResults).name,
    }
    if (exerciseResults.length > 0) results.exercise_results = exerciseResults
    if (row.perceived_effort && row.perceived_effort >= 1 && row.perceived_effort <= 10) {
      results.rpe = row.perceived_effort
    }
    if (durationSeconds > 0) results.elapsed_time_seconds = durationSeconds

    await knex('workout_sessions').insert({
      user_id: row.user_id,
      personalized_workout_id: personalizedId,
      started_at: startedAt.toISOString(),
      completed_at: completedAt ? completedAt.toISOString() : null,
      notes: row.notes,
      results: JSON.stringify(results),
      created_at: row.created_at,
    })
  }

  // Les activités planifiées pointaient vers strength_sessions par référence polymorphique :
  // sans table cible, elles resteraient orphelines dans le calendrier.
  await knex('scheduled_activities').where('activity_type', 'strength').delete()

  await knex.schema.dropTableIfExists('strength_sessions')
}

/**
 * Recrée la table vide. Les séances reprises restent dans `workout_sessions` : les
 * rapatrier automatiquement produirait des doublons à la prochaine migration.
 */
export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('strength_sessions')
  if (hasTable) return

  await knex.schema.createTable('strength_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.date('session_date').notNullable()
    table.specificType('target_muscles', 'text[]').notNullable()
    table.enum('session_goal', ['strength', 'hypertrophy', 'endurance', 'power']).notNullable().defaultTo('hypertrophy')
    table.jsonb('equipment_used').nullable()
    table.enum('source', ['manual', 'ai_generated']).notNullable().defaultTo('ai_generated')
    table.jsonb('ai_plan').nullable()
    table.jsonb('sets_logged').nullable()
    table.integer('perceived_effort').nullable()
    table.integer('duration_minutes').nullable()
    table.text('notes').nullable()
    table.enum('status', ['planned', 'completed', 'skipped']).notNullable().defaultTo('planned')
    table.enum('body_focus', ['upper_body', 'lower_body', 'full_body']).nullable()
    table.enum('training_style', ['traditional', 'strongman']).notNullable().defaultTo('traditional')
    table.timestamps(true, true)

    table.index(['user_id'], 'idx_strength_sessions_user_id')
    table.index(['session_date'], 'idx_strength_sessions_date')
    table.index(['session_goal'], 'idx_strength_sessions_goal')
    table.index(['body_focus'], 'idx_strength_sessions_body_focus')
  })
}
