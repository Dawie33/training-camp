import { z } from 'zod'

/**
 * Résultat structuré d'un exercice au sein d'une séance.
 *
 * Une entrée par exercice de la séance (pas par série) : sur un bloc de force à séries
 * montantes, `load_kg` porte la charge la plus lourde travaillée. Le tableau conserve
 * l'ordre des exercices du workout, ce qui permet à un même mouvement d'apparaître
 * plusieurs fois (ex. thruster en force puis en metcon) sans collision de clé.
 */
export const ExerciseResultSchema = z.object({
  name: z.string().min(1),
  section_type: z.string().min(1),
  load_kg: z.number().nonnegative().max(500).optional(),
  reps_completed: z.number().int().nonnegative().max(10000).optional(),
  sets_completed: z.number().int().nonnegative().max(100).optional(),
  scaled: z.boolean(),
  scaling_note: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
})

/**
 * Contrat du champ `results` (jsonb) d'une `workout_session`.
 *
 * Volontairement permissif (`passthrough`) : les clés historiques du payload
 * (`coros`, `block_progress`, `exercise_details`, `session_title`, `metrics`…) sont
 * conservées telles quelles pour ne pas invalider les séances déjà enregistrées.
 * Seules les clés listées ici sont validées.
 */
export const SessionResultsSchema = z
  .object({
    // Score du conditionnement
    elapsed_time_seconds: z.number().int().nonnegative().max(86400).optional(),
    rounds: z.number().int().nonnegative().max(1000).optional(),
    reps: z.number().int().nonnegative().max(10000).optional(),
    cap_reached: z.boolean().optional(),
    rounds_completed: z.number().int().nonnegative().max(1000).optional(),
    partial_note: z.string().max(500).optional(),

    // Ressenti
    rating: z.number().int().min(1).max(5).optional(),
    /** Effort perçu sur l'ensemble de la séance (échelle CR-10). Croisé avec la durée, il donne la charge de séance (sRPE). */
    rpe: z.number().int().min(1).max(10).optional(),

    // Détail par exercice
    exercise_results: z.array(ExerciseResultSchema).max(60).optional(),
  })
  .passthrough()

export type ExerciseResult = z.infer<typeof ExerciseResultSchema>
export type SessionResults = z.infer<typeof SessionResultsSchema>
