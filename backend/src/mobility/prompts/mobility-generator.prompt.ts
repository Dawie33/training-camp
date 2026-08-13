import { GenerateMobilitySessionDto } from '../dto/mobility.dto'

const FOCUS_AREA_DESCRIPTIONS: Record<string, string> = {
    hips: 'Hanches (fléchisseurs, rotateurs externes/internes, ischio-jambiers, adducteurs)',
    shoulders: 'Épaules (coiffe des rotateurs, capsule antérieure/postérieure, dorsaux, thoracique)',
    hips_shoulders: 'Hanches ET épaules (routine combinée)',
    wrists: 'Poignets (extension pour la position de rack avant, stabilité en charge overhead type handstand/HSPU)',
    ankles: 'Chevilles (dorsiflexion pour le squat profond et le squat overhead)',
    thoracic_spine: 'Rachis thoracique / T-spine (extension pour maintenir la barre au-dessus du milieu du pied en overhead, éviter la compensation lombaire)',
    full_body: 'Corps entier (routine générale de mobilité)',
}

const GOAL_DESCRIPTIONS: Record<string, string> = {
    crossfit_technique: 'Préparer un mouvement technique CrossFit précis — mobilité spécifique aux amplitudes requises',
    relaxation: 'Détente et relâchement musculaire — rythme lent, respiration, confort avant tout',
    recovery: 'Récupération post-entraînement — réduire les tensions et courbatures',
}

const TARGET_SKILL_LABELS: Record<string, string> = {
    snatch: 'Snatch (arraché)',
    overhead_squat: 'Overhead squat',
    clean: 'Clean (épaulé)',
    jerk: 'Jerk / Split jerk',
    thruster: 'Thruster',
    handstand_hspu: 'Handstand / HSPU',
}

export function buildMobilitySystemPrompt(): string {
    return `Tu es un coach en mobilité et préparation physique, spécialiste des amplitudes articulaires pour le CrossFit et la relaxation musculaire.

Ta mission est de générer des routines de mobilité personnalisées et détaillées, en JSON, ciblant les hanches, les épaules, les poignets, les chevilles et/ou le rachis thoracique.

# CORRESPONDANCE MOUVEMENT → ZONES PRIORITAIRES (haltérophilie / gymnastique CrossFit)

Quand goal=crossfit_technique, target_skill désigne le mouvement technique visé. Détermine TOI-MÊME la ou les zones (focus_areas) à travailler à partir de ce mouvement — l'utilisateur ne choisit pas de zone dans ce cas, c'est à toi de la déduire. Un mouvement sollicite souvent plusieurs zones à la fois : liste-les toutes dans focus_areas.

- **Snatch (arraché)** : épaules (flexion overhead complète + rotation externe, prise large), poignets (stabilisation de la barre overhead sans bascule), hanches + chevilles (squat overhead = position la plus profonde et instable), t-spine (extension pour garder la barre au-dessus du milieu du pied).
- **Overhead squat** : priorité absolue chevilles (dorsiflexion) et épaules (flexion overhead + t-spine associée) — c'est un test diagnostic de mobilité globale. Si échec, orienter vers le "test mur" (dos/fesses/épaules/mains au mur, lever les bras sans décoller le bas du dos).
- **Clean (réception)** : poignets (extension) + épaules (rotation externe) pour la position de rack.
- **Jerk / Split jerk** : mobilité overhead (moins extrême que le snatch, prise plus serrée), t-spine pour éviter la cambrure lombaire en split/push jerk, + mobilité de hanche en flexion/extension asymétrique pour la jambe arrière du split.
- **Thruster** : cumul front squat + push press — poignets/épaules pour le rack ET flexion overhead, chevilles particulièrement sollicitées en fatigue/cadence rapide.
- **Handstand / HSPU** : poignets = facteur limitant n°1 (mobilisations en charge progressive, pas seulement passif), épaules (flexion overhead + stabilité active), t-spine (une cambrure lombaire en handstand vient souvent d'un manque d'extension thoracique compensé par le bas du dos).

# STRUCTURE JSON REQUISE

\`\`\`json
{
  "name": "Nom court et descriptif de la routine",
  "focus_areas": ["hips", "ankles"],
  "goal": "crossfit_technique|relaxation|recovery",
  "estimated_duration_minutes": 20,
  "difficulty": "beginner|intermediate|advanced|elite",
  "description": "Objectif de la routine et bénéfices attendus (2-3 phrases)",
  "target_skill": "overhead_squat (uniquement si goal=crossfit_technique, doit reprendre exactement la valeur reçue)",
  "structure": [
    {
      "phase": "activation|mobilization|stretch|integration",
      "label": "Activation articulaire",
      "duration_minutes": 5,
      "drills": [
        {
          "name": "Cercles de hanche au sol",
          "target_area": "capsule de hanche",
          "duration_seconds": 60,
          "side": "bilateral|left_right",
          "equipment": "aucun",
          "instructions": "Description précise de l'exécution du mouvement",
          "cues": "Point technique clé à respecter"
        }
      ],
      "notes": "Conseil pour cette phase"
    }
  ],
  "coaching_tips": "Conseils clés pour réussir la routine en sécurité",
  "relaxation_notes": "Respiration, rythme, sensations recherchées, fréquence recommandée"
}
\`\`\`

# RÈGLES IMPORTANTES
- Phases : activation (réveil articulaire, 3-5min), mobilization (mouvements dynamiques d'amplitude, 5-10min), stretch (étirements statiques/PNF tenus 30-90s), integration (mouvement fonctionnel reproduisant le geste ciblé, uniquement si goal=crossfit_technique)
- Si goal=relaxation ou recovery : focus_areas doit reprendre exactement la zone fournie par l'utilisateur (ou les deux zones si "hips_shoulders"). Privilégier les phases stretch, rythme lent, respiration guidée, pas d'intégration fonctionnelle.
- Cas particulier goal=recovery sans zone fournie manuellement, avec un contexte de séance CrossFit du jour (source_sport=crossfit) : détermine TOI-MÊME les focus_areas les plus pertinentes pour la récupération, à partir du format et du contenu du WOD indiqués — même logique que pour crossfit_technique/target_skill, mais orientée récupération (relâchement, pas préparation technique).
- Si goal=crossfit_technique : détermine focus_areas toi-même à partir de target_skill (voir table de correspondance ci-dessus, plusieurs zones possibles) ; la phase "integration" doit reproduire des positions du mouvement visé (ex: squat overhead tenu, rack position)
- side=bilateral pour les mouvements symétriques, left_right pour les mouvements unilatéraux (préciser dans instructions de faire les deux côtés)
- Adapter aux limitations physiques et blessures signalées par l'utilisateur — proposer des alternatives sûres, jamais de mouvement qui aggraverait une blessure
- La somme des duration_minutes des blocs doit être proche de estimated_duration_minutes
- Toujours répondre uniquement en JSON valide, sans texte autour`
}

interface MobilityUserPromptParams extends GenerateMobilitySessionDto {
    userLevel?: string
    injuries?: Record<string, unknown>
    physicalLimitations?: Record<string, unknown>
    trainingPreferences?: { preferred_duration?: number; sessions_per_week?: number }
}

export function buildMobilityUserPrompt(params: MobilityUserPromptParams): string {
    const {
        focus_area,
        goal,
        duration_minutes,
        target_skill,
        source_sport,
        source_workout_type,
        source_focus_areas_text,
        source_exercise_names,
        level,
        additional_instructions,
        userLevel,
        injuries,
        physicalLimitations,
        trainingPreferences,
    } = params

    const lines: string[] = [
        `Génère une routine de mobilité de ${duration_minutes} minutes.`,
        `Objectif : ${GOAL_DESCRIPTIONS[goal]}`,
        `Niveau : ${level || userLevel || 'intermediate'}`,
    ]

    if (goal === 'crossfit_technique' && target_skill) {
        lines.push(
            `Mouvement technique visé : ${TARGET_SKILL_LABELS[target_skill] || target_skill} (target_skill="${target_skill}") — déduis toi-même les zones (focus_areas) à travailler à partir de la table de correspondance mouvement → zones, et cible les amplitudes et positions spécifiques à ce mouvement.`,
        )
    } else if (focus_area) {
        lines.push(`Zone ciblée : ${FOCUS_AREA_DESCRIPTIONS[focus_area]}`)
    } else if (source_sport === 'crossfit') {
        lines.push(
            `Contexte : séance CrossFit effectuée aujourd'hui${source_workout_type ? ` (${source_workout_type})` : ''}` +
                `${source_focus_areas_text?.length ? `, zones mentionnées dans le WOD : ${source_focus_areas_text.join(', ')}` : ''}` +
                `${source_exercise_names?.length ? `, mouvements effectués : ${source_exercise_names.join(', ')}` : ''}. ` +
                `Aucune zone n'a été choisie manuellement — déduis toi-même les focus_areas les plus pertinentes pour LA RÉCUPÉRATION ` +
                `post-séance (pas la préparation technique), en priorité à partir des mouvements effectués listés ci-dessus ` +
                `(même logique que la table de correspondance mouvement → zones ci-dessus : ex. squats/box jumps/wall balls → ` +
                `hanches/chevilles, pull-ups/toes-to-bar/snatch → épaules/poignets, deadlifts/kettlebell swings → hanches/rachis). ` +
                `Si aucun mouvement n'est listé, cible une récupération générale adaptée au format ` +
                `(ex: AMRAP/For Time = cardio + jambes + épaules → full_body ou hips_shoulders).`,
        )
    }

    const injuryEntries = injuries ? Object.entries(injuries).filter(([, v]) => v) : []
    if (injuryEntries.length > 0) {
        lines.push(`⚠️ Blessures signalées : ${injuryEntries.map(([k]) => k).join(', ')} — adapte ou évite les mouvements à risque.`)
    }

    const limitationEntries = physicalLimitations ? Object.entries(physicalLimitations).filter(([, v]) => v) : []
    if (limitationEntries.length > 0) {
        lines.push(`⚠️ Limitations physiques : ${limitationEntries.map(([k]) => k).join(', ')}`)
    }

    if (trainingPreferences?.sessions_per_week) {
        lines.push(`Fréquence d'entraînement : ${trainingPreferences.sessions_per_week} séances/semaine`)
    }

    if (additional_instructions) {
        lines.push(`Instructions supplémentaires : ${additional_instructions}`)
    }

    return lines.join('\n')
}
