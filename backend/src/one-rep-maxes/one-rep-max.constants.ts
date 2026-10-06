/**
 * Mouvements pour lesquels un 1RM peut être enregistré.
 * Garder synchronisé avec CROSSFIT_LIFTS (frontend/services/one-rep-maxes.ts) : un mouvement
 * absent d'ici est rejeté (400). Une faute de frappe créerait sinon un mouvement fantôme,
 * ignoré sans prévenir par le diagnostic des ratios de force.
 */
export const ONE_REP_MAX_LIFTS = [
  'back_squat',
  'front_squat',
  'deadlift',
  'clean',
  'clean_and_jerk',
  'snatch',
  'overhead_squat',
  'strict_press',
  'push_press',
  'thruster',
  'pull_up',
  'dips',
] as const

export type OneRepMaxLift = (typeof ONE_REP_MAX_LIFTS)[number]

/** Bien au-delà des records du monde : au-dessus, c'est une erreur de saisie (1 500 au lieu de 150). */
export const ONE_REP_MAX_MAX_KG = 500
