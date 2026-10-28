import { OneRepMaxLift } from 'src/one-rep-maxes/one-rep-max.constants'

/**
 * Noms de mouvement saisis (normalisés par `normalizeMovementName`) qui désignent un lift à 1RM.
 * Les noms identiques à la clé du lift (« Back Squat » → `back_squat`) n'ont pas besoin d'alias.
 *
 * Volontairement absents : Power Clean et Power Snatch. Ils valent environ 80-85 % de la version
 * complète, les rapporter au 1RM du Clean ou du Snatch sous-estimerait l'intensité réelle.
 */
const LIFT_ALIASES: Record<string, OneRepMaxLift> = {
  clean_jerk: 'clean_and_jerk',
  c_j: 'clean_and_jerk',
  cj: 'clean_and_jerk',
  epaule_jete: 'clean_and_jerk',
  squat_clean_and_jerk: 'clean_and_jerk',
  squat_clean_jerk: 'clean_and_jerk',
  squat_clean: 'clean',
  epaule: 'clean',
  squat_snatch: 'snatch',
  arrache: 'snatch',
  squat_arriere: 'back_squat',
  squat_avant: 'front_squat',
  souleve_de_terre: 'deadlift',
  ohs: 'overhead_squat',
  shoulder_press: 'strict_press',
  overhead_press: 'strict_press',
  developpe_militaire: 'strict_press',
  pull_ups: 'pull_up',
  pullup: 'pull_up',
  weighted_pull_up: 'pull_up',
  dip: 'dips',
}

/** Forme comparable d'un nom de mouvement : minuscules, sans accents, mots séparés par `_`. */
export function normalizeMovementName(movementName: string): string {
  return movementName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * Clé de regroupement d'un mouvement : l'identifiant du lift quand le nom en désigne un
 * (pour lire son 1RM), sinon le nom normalisé.
 *
 * @param movementName Nom saisi dans le log de séance
 */
export function resolveMovementKey(movementName: string): string {
  const normalized = normalizeMovementName(movementName)
  return LIFT_ALIASES[normalized] ?? normalized
}
