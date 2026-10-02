import { Injury, InjurySeverity, InjurySide, InjuryStatus, InjuryZone, PainfulPattern } from './injury.constants'

const ZONE_LABELS: Record<InjuryZone, string> = {
  shoulder: 'Épaule',
  elbow: 'Coude',
  wrist_hand: 'Poignet / main',
  neck: 'Nuque',
  upper_back: 'Haut du dos',
  lower_back: 'Bas du dos',
  hip: 'Hanche',
  knee: 'Genou',
  ankle_foot: 'Cheville / pied',
  other: 'Autre zone',
}

const SIDE_LABELS: Record<InjurySide, string> = {
  left: 'gauche',
  right: 'droite',
  both: 'des deux côtés',
  none: '',
}

const STATUS_LABELS: Record<InjuryStatus, string> = {
  active: 'ACTIVE',
  recovering: 'EN REPRISE',
  past: 'ANTÉCÉDENT',
}

const SEVERITY_LABELS: Record<InjurySeverity, string> = {
  mild: 'gêne légère',
  moderate: 'douleur sur certains mouvements',
  severe: 'douleur au quotidien',
}

/** Exemples volontairement concrets : l'IA s'en sert pour exclure ou remplacer de façon fiable. */
const PATTERN_LABELS: Record<PainfulPattern, string> = {
  overhead: 'au-dessus de la tête (jerk, snatch, push press, HSPU, wall ball)',
  kipping: 'kipping (kipping pull-up, T2B, muscle-up, kipping HSPU)',
  hanging: 'suspension (pull-up, T2B, muscle-up, corde)',
  pushing: 'poussée (push-up, bench press, dips)',
  front_rack: 'front rack (front squat, clean, thruster)',
  deep_squat: 'squat profond (squat complet, pistol, wall ball)',
  hinge: 'charnière de hanche (deadlift, KB swing, good morning)',
  impact: 'impacts (course, sauts, double-unders, box jumps)',
  spinal_flexion: 'flexion du rachis (sit-up, GHD, V-up)',
  wrist_extension: 'extension du poignet (push-up, HSPU, front rack)',
}

const STATUS_RULES: Record<InjuryStatus, string> = {
  active:
    "ACTIVE : exclus tout mouvement qui sollicite la zone ou les familles douloureuses et remplace-le par une variante qui préserve le stimulus de la séance. Si la douleur est quotidienne, mets la zone au repos complet, travaille le reste du corps et recommande de consulter un professionnel de santé.",
  recovering:
    "EN REPRISE : garde les mouvements de la zone mais adapte-les : charge ≤ 60-70 % du 1RM, amplitude contrôlée, tempo lent, aucun kipping sollicitant la zone. Ajoute un exercice de renforcement ciblé dans l'accessoire.",
  past: "ANTÉCÉDENT : aucune exclusion. Ajoute de la prévention ciblée dans l'accessoire et limite la montée en volume sur la zone.",
}

function describeInjury(injury: Injury): string {
  const zone = [ZONE_LABELS[injury.zone], SIDE_LABELS[injury.side]].filter(Boolean).join(' ')
  const parts = [`${zone} — ${STATUS_LABELS[injury.status]}, ${SEVERITY_LABELS[injury.severity]}`]
  if (injury.since) parts.push(`depuis ${injury.since}`)
  if (injury.painful_patterns.length > 0) {
    parts.push(`douloureux : ${injury.painful_patterns.map((p) => PATTERN_LABELS[p]).join(' ; ')}`)
  }
  if (injury.notes) parts.push(`note de l'athlète : « ${injury.notes} »`)
  return `- ${parts.join(' — ')}`
}

/**
 * Bloc « blessures » commun à tous les prompts IA, avec les règles de programmation
 * propres à chaque statut présent. Renvoie une chaîne vide s'il n'y a aucune blessure.
 */
export function formatInjuriesForPrompt(injuries: Injury[]): string {
  if (injuries.length === 0) return ''

  const statuses = [...new Set(injuries.map((i) => i.status))]
  const rules = statuses.map((status) => `- ${STATUS_RULES[status]}`)

  return [
    "**Blessures et douleurs** (déclarées par l'athlète — adapte la programmation, ne pose jamais de diagnostic) :",
    ...injuries.map(describeInjury),
    '',
    '**Règles à appliquer** :',
    ...rules,
    "- Sans famille douloureuse précisée, déduis les mouvements à risque à partir de la zone. Ne fais jamais travailler l'athlète à travers la douleur.",
  ].join('\n')
}
