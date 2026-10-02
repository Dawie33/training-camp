// ============================================================================
// BLESSURES DU PROFIL ATHLÈTE
// Garder synchronisé avec backend/src/common/injuries/injury.constants.ts :
// une valeur absente côté backend est rejetée (HTTP 400) par PATCH /users/me.
// ============================================================================

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
export const INJURY_STATUSES = ['active', 'recovering', 'past'] as const
export const INJURY_SEVERITIES = ['mild', 'moderate', 'severe'] as const

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

export const ZONE_LABELS: Record<InjuryZone, string> = {
  shoulder: 'Épaule',
  elbow: 'Coude',
  wrist_hand: 'Poignet / main',
  neck: 'Nuque',
  upper_back: 'Haut du dos',
  lower_back: 'Bas du dos',
  hip: 'Hanche',
  knee: 'Genou',
  ankle_foot: 'Cheville / pied',
  other: 'Autre',
}

export const SIDE_LABELS: Record<InjurySide, string> = {
  left: 'Gauche',
  right: 'Droit',
  both: 'Les deux',
  none: 'Sans objet',
}

export const STATUS_LABELS: Record<InjuryStatus, string> = {
  active: 'Active',
  recovering: 'En reprise',
  past: 'Antécédent',
}

/** Ce que l'IA fera pour chaque statut : affiché sous le choix du statut. */
export const STATUS_DESCRIPTIONS: Record<InjuryStatus, string> = {
  active: 'Les mouvements douloureux sont exclus et remplacés.',
  recovering: 'Les mouvements sont gardés mais allégés : charge réduite, amplitude contrôlée, pas de kipping.',
  past: 'Aucune exclusion : prévention ciblée et montée en volume progressive.',
}

export const SEVERITY_LABELS: Record<InjurySeverity, string> = {
  mild: 'Gêne légère',
  moderate: 'Douleur sur certains mouvements',
  severe: 'Douleur au quotidien',
}

export const PATTERN_LABELS: Record<PainfulPattern, string> = {
  overhead: 'Au-dessus de la tête',
  kipping: 'Kipping',
  hanging: 'Suspension',
  pushing: 'Poussée',
  front_rack: 'Front rack',
  deep_squat: 'Squat profond',
  hinge: 'Charnière de hanche',
  impact: 'Impacts',
  spinal_flexion: 'Flexion du dos',
  wrist_extension: 'Extension du poignet',
}

/** Exemples d'exercices, affichés en infobulle sur chaque famille. */
export const PATTERN_EXAMPLES: Record<PainfulPattern, string> = {
  overhead: 'jerk, snatch, push press, HSPU, wall ball',
  kipping: 'kipping pull-up, T2B, muscle-up, kipping HSPU',
  hanging: 'pull-up, T2B, muscle-up, corde',
  pushing: 'push-up, bench press, dips',
  front_rack: 'front squat, clean, thruster',
  deep_squat: 'squat complet, pistol, wall ball',
  hinge: 'deadlift, KB swing, good morning',
  impact: 'course, sauts, double-unders, box jumps',
  spinal_flexion: 'sit-up, GHD, V-up',
  wrist_extension: 'push-up, HSPU, front rack',
}

const SIDE_SUFFIXES: Record<InjurySide, string> = {
  left: 'côté gauche',
  right: 'côté droit',
  both: 'des deux côtés',
  none: '',
}

/**
 * Libellé court d'une blessure : « Genou, côté gauche », « Bas du dos ».
 * Forme invariable : « droite » ne s'accorde pas avec toutes les zones.
 */
export function formatInjuryZone(injury: Pick<Injury, 'zone' | 'side'>): string {
  return [ZONE_LABELS[injury.zone], SIDE_SUFFIXES[injury.side]].filter(Boolean).join(', ')
}
