import { z } from 'zod'

/**
 * Contrat de l'analyse post-séance renvoyée par l'IA.
 *
 * Validé avant stockage dans `workout_sessions.ai_analysis` : une réponse mal formée
 * ne doit jamais atteindre la base, sous peine de casser l'affichage de la modale.
 */
export const WodAnalysisSchema = z.object({
  summary: z.string().min(1),
  performance_level: z.enum(['pr', 'above_average', 'average', 'below_average', 'first_time']),
  comparison: z.string().nullable(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  next_steps: z.string().min(1),
})

export type WodAnalysis = z.infer<typeof WodAnalysisSchema>
