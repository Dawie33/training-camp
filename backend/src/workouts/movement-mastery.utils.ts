import type { UserAIContext } from './services/user-context.service'

/**
 * Mouvements debloques par un 1RM enregistre pour ce lift, au-dela du niveau
 * declare (sport_level). Un athlete qui a un 1RM reel sur un mouvement en
 * maitrise forcement la technique, independamment de ce qu'il a coche comme
 * niveau general. Cle = valeur du champ `lift` (voir CROSSFIT_LIFTS cote front).
 */
const LIFT_UNLOCKS: Record<string, string[]> = {
  back_squat: ['Back Squat'],
  front_squat: ['Front Squat'],
  deadlift: ['Deadlift', 'Sumo Deadlift High Pull'],
  clean: ['Clean', 'Power Clean', 'Squat Clean'],
  clean_and_jerk: ['Clean', 'Power Clean', 'Squat Clean', 'Jerk', 'Push Jerk', 'Split Jerk'],
  snatch: ['Hang Snatch', 'Push Snatch', 'Snatch Balance', 'Overhead Squat'],
  overhead_squat: ['Overhead Squat'],
  strict_press: ['Overhead Press'],
  push_press: ['Push Press', 'Push Jerk'],
  thruster: ['Thruster'],
  pull_up: ['Pull-Up', 'Burpee Pull-Up', 'Toes-to-Bar', 'Strict Toes-to-Bar'],
  dips: ['Ring Dip'],
}

/**
 * Calcule la liste des mouvements a debloquer pour la generation d'un
 * programme, au-dela de ce que permettrait le seul `sport_level` declare :
 * - un 1RM enregistre pour un lift donne debloque les mouvements de sa famille
 *   (voir LIFT_UNLOCKS) ;
 * - un programme de competence termine (skill_programs.status = 'completed')
 *   debloque le mouvement correspondant, compare par nom en matching flou
 *   cote ExercisesService.findForProgram (le nom du skill ne correspond pas
 *   toujours exactement au nom de l'exercice en base, ex: "Muscle-Up" vs
 *   "Ring Muscle-Up").
 */
export function resolveUnlockedMovementNames(
  context: Pick<UserAIContext, 'oneRepMaxes' | 'completedSkillNames'>,
): string[] {
  const fromLifts = context.oneRepMaxes.flatMap((rm) => LIFT_UNLOCKS[rm.lift] ?? [])
  return [...new Set([...fromLifts, ...context.completedSkillNames])]
}
