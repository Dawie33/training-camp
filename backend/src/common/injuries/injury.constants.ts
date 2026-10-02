/**
 * Modèle d'une blessure du profil athlète (colonne users.injuries, tableau JSON).
 * Source unique des valeurs autorisées : DTO d'entrée, lecture en base et prompts IA.
 */

export const INJURY_ZONES = [
  'shoulder',
  'elbow',
  'wrist_hand',
  'neck',
  'upper_back',
  'lower_back',
  'hip',
  'knee',
  'ankle_foot',
  'other',
] as const

export const INJURY_SIDES = ['left', 'right', 'both', 'none'] as const

/** active = mouvements exclus · recovering = mouvements adaptés · past = prévention seulement */
export const INJURY_STATUSES = ['active', 'recovering', 'past'] as const

export const INJURY_SEVERITIES = ['mild', 'moderate', 'severe'] as const

/** Familles de mouvements : une famille couvre tous les exercices qui sollicitent la zone de la même façon. */
export const PAINFUL_PATTERNS = [
  'overhead',
  'kipping',
  'hanging',
  'pushing',
  'front_rack',
  'deep_squat',
  'hinge',
  'impact',
  'spinal_flexion',
  'wrist_extension',
] as const

export const INJURY_NOTES_MAX_LENGTH = 300
export const INJURIES_MAX_COUNT = 20

export type InjuryZone = (typeof INJURY_ZONES)[number]
export type InjurySide = (typeof INJURY_SIDES)[number]
export type InjuryStatus = (typeof INJURY_STATUSES)[number]
export type InjurySeverity = (typeof INJURY_SEVERITIES)[number]
export type PainfulPattern = (typeof PAINFUL_PATTERNS)[number]

export interface Injury {
  zone: InjuryZone
  side: InjurySide
  status: InjuryStatus
  severity: InjurySeverity
  painful_patterns: PainfulPattern[]
  /** Mois de début, format AAAA-MM */
  since?: string
  notes?: string
}

export const INJURY_SINCE_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/
