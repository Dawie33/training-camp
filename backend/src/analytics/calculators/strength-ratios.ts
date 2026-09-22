import { RatioVerdict, StrengthRatio, StrengthRatiosResult } from '../types/analytics.types'

interface RatioDefinition {
  key: string
  label: string
  numerator: string
  denominator: string
  targetMinPct: number
  targetMaxPct: number
  whenBelow: string
  whenAbove: string
  whenInRange: string
}

/**
 * Ratios diagnostiques entre 1RM. Ce sont des fourchettes indicatives, pas des normes :
 * elles s'ajustent au gabarit, à l'âge et à l'ancienneté d'entraînement. Un écart marqué
 * ne juge pas l'athlète, il désigne la cible du prochain bloc.
 */
const RATIO_DEFINITIONS: RatioDefinition[] = [
  {
    key: 'snatch_to_clean_and_jerk',
    label: 'Snatch / Clean & Jerk',
    numerator: 'snatch',
    denominator: 'clean_and_jerk',
    targetMinPct: 78,
    targetMaxPct: 82,
    whenBelow: 'Snatch bas par rapport au C&J : la limite est technique ou vient de la mobilité overhead, pas de la force. Travaille les positions et les complexes légers (60-75 %) plutôt que les charges.',
    whenAbove: 'Snatch élevé par rapport au C&J : ton snatch est bien maîtrisé, c\'est le clean & jerk qui a de la marge — probablement le jerk. Vérifie la réception et le drive.',
    whenInRange: 'Équilibre sain entre les deux mouvements olympiques.',
  },
  {
    key: 'front_squat_to_back_squat',
    label: 'Front Squat / Back Squat',
    numerator: 'front_squat',
    denominator: 'back_squat',
    targetMinPct: 82,
    targetMaxPct: 88,
    whenBelow: 'Front squat bas : position de réception et gainage antérieur en cause. C\'est le plafond direct de ton clean — travaille le front rack, les pauses en bas et le gainage anti-flexion.',
    whenAbove: 'Front squat très proche du back squat : c\'est ta force maximale en back squat qui devient le facteur limitant.',
    whenInRange: 'Rapport classique entre les deux squats.',
  },
  {
    key: 'clean_and_jerk_to_back_squat',
    label: 'Clean & Jerk / Back Squat',
    numerator: 'clean_and_jerk',
    denominator: 'back_squat',
    targetMinPct: 70,
    targetMaxPct: 75,
    whenBelow: 'C&J bas par rapport au squat : tu as la force, il te manque la technique et la vitesse pour l\'exprimer. Priorité au volume technique, pas à plus de squat.',
    whenAbove: 'C&J proche du back squat : ta technique exploite déjà tout ce que tu as. C\'est la force maximale qu\'il faut monter pour débloquer le reste.',
    whenInRange: 'Force et technique progressent au même rythme.',
  },
  {
    key: 'deadlift_to_back_squat',
    label: 'Deadlift / Back Squat',
    numerator: 'deadlift',
    denominator: 'back_squat',
    targetMinPct: 120,
    targetMaxPct: 130,
    whenBelow: 'Deadlift bas par rapport au squat : chaîne postérieure en retard. RDL, good mornings, hip hinge à tempo — en gardant le deadlift lourd à toutes les 2-3 semaines seulement.',
    whenAbove: 'Deadlift très supérieur au squat : bonne chaîne postérieure, mais ton squat mérite un bloc dédié.',
    whenInRange: 'Rapport attendu entre tirage au sol et squat.',
  },
  {
    key: 'overhead_squat_to_back_squat',
    label: 'Overhead Squat / Back Squat',
    numerator: 'overhead_squat',
    denominator: 'back_squat',
    targetMinPct: 60,
    targetMaxPct: 70,
    whenBelow: 'Overhead squat bas : mobilité thoracique et d\'épaule, ou stabilité overhead. C\'est le verrou qui bloque aussi ton snatch.',
    whenAbove: 'Overhead squat élevé : excellente position overhead, ton back squat a de la marge.',
    whenInRange: 'Position overhead cohérente avec ta force de squat.',
  },
]

/** Arrondi à une décimale, pour ne pas afficher de fausse précision. */
function roundTo1(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * Calcule les ratios diagnostiques entre 1RM et l'interprétation coach de chaque écart.
 *
 * @param oneRepMaxes Charges maximales par lift, en kg (clé = identifiant du lift)
 * @returns Les ratios calculables et la liste des lifts manquants
 */
export function computeStrengthRatios(oneRepMaxes: Record<string, number>): StrengthRatiosResult {
  const missing = new Set<string>()

  const ratios: StrengthRatio[] = RATIO_DEFINITIONS.map(def => {
    const numerator = oneRepMaxes[def.numerator]
    const denominator = oneRepMaxes[def.denominator]

    if (!numerator || !denominator || denominator <= 0) {
      if (!numerator) missing.add(def.numerator)
      if (!denominator) missing.add(def.denominator)
      return {
        key: def.key,
        label: def.label,
        value_pct: null,
        target_min_pct: def.targetMinPct,
        target_max_pct: def.targetMaxPct,
        verdict: 'unavailable' as RatioVerdict,
        interpretation: 'Renseigne les deux 1RM pour débloquer ce diagnostic.',
      }
    }

    const valuePct = roundTo1((numerator / denominator) * 100)
    let verdict: RatioVerdict = 'in_range'
    let interpretation = def.whenInRange
    if (valuePct < def.targetMinPct) {
      verdict = 'below'
      interpretation = def.whenBelow
    } else if (valuePct > def.targetMaxPct) {
      verdict = 'above'
      interpretation = def.whenAbove
    }

    return {
      key: def.key,
      label: def.label,
      value_pct: valuePct,
      target_min_pct: def.targetMinPct,
      target_max_pct: def.targetMaxPct,
      verdict,
      interpretation,
    }
  })

  return { ratios, missing_lifts: [...missing].sort() }
}
