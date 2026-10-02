import { z } from 'zod'
import {
  INJURY_NOTES_MAX_LENGTH,
  INJURY_SEVERITIES,
  INJURY_SIDES,
  INJURY_SINCE_REGEX,
  INJURY_STATUSES,
  INJURY_ZONES,
  Injury,
  PAINFUL_PATTERNS,
} from './injury.constants'

export const InjurySchema = z.object({
  zone: z.enum(INJURY_ZONES),
  side: z.enum(INJURY_SIDES),
  status: z.enum(INJURY_STATUSES),
  severity: z.enum(INJURY_SEVERITIES),
  painful_patterns: z.array(z.enum(PAINFUL_PATTERNS)).default([]),
  since: z.string().regex(INJURY_SINCE_REGEX).optional(),
  notes: z.string().max(INJURY_NOTES_MAX_LENGTH).optional(),
})

/**
 * Lit la colonne users.injuries. Les entrées qui ne respectent pas le modèle
 * (ancien format de l'onboarding : tableau de chaînes ou objet libre) sont ignorées,
 * pour ne jamais transmettre de données mal formées au front ou à l'IA.
 */
export function parseStoredInjuries(raw: unknown): Injury[] {
  const value = typeof raw === 'string' ? safeJsonParse(raw) : raw
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    const parsed = InjurySchema.safeParse(entry)
    return parsed.success ? [parsed.data] : []
  })
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
