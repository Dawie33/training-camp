import { z } from 'zod'

/**
 * L'IA renvoie parfois un booleen a la place d'un champ numerique (ex:
 * "calories": true), un artefact du champ score_type/type mal interprete.
 * Un booleen n'a pas de valeur numerique raisonnable a en deduire : on
 * abandonne le champ (null) plutot que de faire echouer toute la generation.
 */
function nullifyBoolean(value: unknown): unknown {
  return typeof value === 'boolean' ? null : value
}

/**
 * L'IA renvoie parfois un nombre entier sous forme decimale (ex: 12.0 -> 12,
 * ou plus rarement une vraie fraction comme 21.5), voire 0 ou un negatif pour
 * un champ "positive()", ou meme un booleen (voir nullifyBoolean). On normalise
 * (arrondi + clamp a 1 minimum) plutot que de faire echouer toute la
 * generation pour un champ numerique secondaire.
 */
function roundToIntIfNumber(value: unknown): unknown {
  const v = nullifyBoolean(value)
  if (typeof v === 'number' && Number.isFinite(v)) {
    return Math.max(1, Math.round(v))
  }
  return v
}

/**
 * Meme logique que roundToIntIfNumber, mais pour un champ numerique positif
 * qui n'est pas force a etre entier (ex: duration_minutes).
 */
function clampToPositiveIfNumber(value: unknown): unknown {
  const v = nullifyBoolean(value)
  if (typeof v === 'number' && Number.isFinite(v) && v <= 0) {
    return 1
  }
  return v
}

export const StrengthMovementSchema = z.object({
  name: z.string().min(1),
  sets: z.preprocess(roundToIntIfNumber, z.number().int().positive()),
  reps: z.preprocess(roundToIntIfNumber, z.union([z.number().int().positive(), z.string().min(1)])),
  intensity: z.string().optional().nullable(),
  rest: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const ConditioningMovementSchema = z.object({
  name: z.string().min(1),
  reps: z.preprocess(roundToIntIfNumber, z.union([z.number().int().positive(), z.string()]).optional().nullable()),
  distance: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  calories: z.preprocess(roundToIntIfNumber, z.number().int().positive().optional().nullable()),
  time: z.string().optional().nullable(),
})

export const ConditioningSchema = z.object({
  type: z.enum(['amrap', 'for_time', 'emom', 'tabata', 'rounds_for_time', 'death_by', 'chipper']),
  duration_minutes: z.preprocess(clampToPositiveIfNumber, z.number().positive().optional().nullable()),
  rounds: z.preprocess(roundToIntIfNumber, z.number().int().positive().optional().nullable()),
  movements: z.array(ConditioningMovementSchema).min(1),
  score_type: z.preprocess((value) => normalizeScoreType(value), z.enum(['rounds_and_reps', 'time', 'weight', 'calories', 'reps']).optional().nullable()),
  scaling_notes: z.string().optional().nullable(),
})

const ALLOWED_SCORE_TYPES = ['rounds_and_reps', 'time', 'weight', 'calories', 'reps']

/**
 * L'IA renvoie parfois plusieurs choix separes par `|` (ancien bug), ou
 * invente des synonymes hors enum (ex: "total_reps", "time_to_finish").
 * Ce helper normalise vers une valeur autorisee par mot-cle plutot que par
 * une liste de synonymes exhaustive, forcement incomplete face a l'IA.
 */
function normalizeScoreType(value: unknown): unknown {
  if (typeof value !== 'string') return value

  const candidates = value.includes('|') ? value.split('|').map((part) => part.trim()) : [value]
  const exactMatch = candidates.find((candidate) => ALLOWED_SCORE_TYPES.includes(candidate))
  if (exactMatch) return exactMatch

  const normalized = candidates[0]?.toLowerCase() ?? ''
  if (normalized.includes('round')) return 'rounds_and_reps'
  if (normalized.includes('completion') || normalized.includes('minute') || normalized.includes('interval')) return 'rounds_and_reps'
  if (normalized.includes('rep')) return 'reps'
  if (normalized.includes('time')) return 'time'
  if (normalized.includes('weight') || normalized.includes('load')) return 'weight'
  if (normalized.includes('cal')) return 'calories'

  // Champ optionnel : un synonyme non reconnu ne doit pas faire echouer toute
  // la generation du programme, on abandonne juste le score_type plutot que
  // de laisser Zod rejeter une valeur hors enum.
  return null
}

export const SkillWorkSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  sets: z.preprocess(roundToIntIfNumber, z.number().int().positive().optional().nullable()),
  duration: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const StrengthWorkSchema = z.object({
  movements: z.array(StrengthMovementSchema).min(1),
})

/**
 * L'IA renvoie parfois un bloc vide `{}`, partiel, ou meme une chaine de
 * texte au lieu de `null`. Ce helper normalise un tel bloc en `null` (au
 * lieu de faire echouer la validation), en s'appuyant sur un predicat de
 * validite minimale.
 */
const nullifyEmptyBlock =
  (isValid: (o: Record<string, unknown>) => boolean) =>
    (v: unknown): unknown => {
      if (v == null) return null
      if (typeof v !== 'object') return null
      return isValid(v as Record<string, unknown>) ? v : null
    }

const hasMovements = (o: Record<string, unknown>): boolean =>
  Array.isArray(o.movements) && o.movements.length > 0

export const ProgramSessionSchema = z.object({
  week: z.number().int().positive().optional(),
  session_in_week: z.number().int().min(1),
  title: z.string().min(1),
  focus: z.enum(['strength', 'conditioning', 'skill', 'mixed', 'recovery']),
  estimated_duration: z.preprocess(clampToPositiveIfNumber, z.number().positive()),
  strength_work: z.preprocess(nullifyEmptyBlock(hasMovements), StrengthWorkSchema.nullable()).optional(),
  conditioning: z.preprocess(nullifyEmptyBlock(hasMovements), ConditioningSchema.nullable()).optional(),
  skill_work: z
    .preprocess(nullifyEmptyBlock((o) => !!o.name && !!o.description), SkillWorkSchema.nullable())
    .optional(),
  coach_notes: z.string().optional().nullable(),
})

export const ProgramPhaseSchema = z.object({
  phase_number: z.number().int().positive(),
  name: z.string().min(1),
  weeks: z.array(z.number().int().positive()).min(1),
  description: z.string(),
  sessions: z.array(ProgramSessionSchema).min(1),
})

export const GeneratedProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  objectives: z.string(),
  phases: z.array(ProgramPhaseSchema).min(1),
  progression_notes: z.string(),
  coach_notes: z.string().optional().nullable(),
})

export const GeneratedWeeklySessionsSchema = z.object({
  sessions: z.array(ProgramSessionSchema),
})

export type StrengthMovement = z.infer<typeof StrengthMovementSchema>
export type ConditioningMovement = z.infer<typeof ConditioningMovementSchema>
export type Conditioning = z.infer<typeof ConditioningSchema>
export type ProgramSession = z.infer<typeof ProgramSessionSchema>
export type ProgramPhase = z.infer<typeof ProgramPhaseSchema>
export type GeneratedProgramValidated = z.infer<typeof GeneratedProgramSchema>
