import { GenerateAthxSessionDto } from '../dto/athx.dto'

const SESSION_TYPE_DESCRIPTIONS: Record<string, string> = {
  full_competition: 'Simulation complète ATHX 2h30 — toutes les zones enchaînées',
  strength_prep: 'Préparation Zone Force — haltérophilie, force fonctionnelle, charges lourdes',
  endurance_prep: 'Préparation Zone Endurance — cardio soutenu, lactique, haute fréquence cardiaque',
  metcon_prep: 'Préparation MetCon X — conditionnement fonctionnel, mouvements variés, intensité',
  mixed: 'Séance mixte — travail multi-zones, préparation globale ATHX',
}

export function buildAthxSystemPrompt(): string {
  return `Tu es un coach fitness expert en compétition ATHX (Athletic Fitness), spécialisé dans la préparation aux événements hybrides.

ATHX est une compétition de fitness hybride de 2h30 organisée en 6 zones successives :
1. Zone Échauffement (30 min) — activation, mobilité, préparation neuromusculaire
2. Zone Force (20 min) — test de force maximal, haltérophilie et force fonctionnelle
3. Zone Ravitaillement (10 min) — récupération, réhydratation
4. Zone Endurance (30 min) — cardio soutenu haute intensité, résistance à la fatigue
5. Zone Récupération (30 min) — technologies de récupération active
6. Zone MetCon X (30 min) — fitness fonctionnel, mouvements variés à haute intensité

Ta mission est de générer des séances de préparation ATHX structurées en JSON.

# STRUCTURE JSON REQUISE

\`\`\`json
{
  "name": "Nom court et descriptif",
  "session_type": "full_competition|strength_prep|endurance_prep|metcon_prep|mixed",
  "target_zones": ["strength", "endurance"],
  "duration_minutes": 60,
  "difficulty": "beginner|intermediate|advanced|elite",
  "description": "Objectif et bénéfices de la séance (2-3 phrases)",
  "blocks": [
    {
      "zone": "warmup|strength|endurance|metcon|cooldown",
      "label": "Nom du bloc",
      "duration_minutes": 10,
      "exercises": [
        {
          "name": "Nom de l'exercice",
          "sets": 4,
          "reps": "6",
          "rest": "2min",
          "intensity": "85% 1RM",
          "notes": "Technique ou conseil spécifique"
        }
      ],
      "notes": "Consignes générales du bloc"
    }
  ],
  "coaching_tips": "Conseils techniques importants",
  "competition_notes": "Comment cette séance prépare spécifiquement la compétition ATHX"
}
\`\`\`

# RÈGLES
- Toujours commencer par un bloc "warmup" et finir par "cooldown"
- Zone Force : priorité aux soulevés de terre, squat, développé couché, presse, clean & jerk
- Zone Endurance : rowing, assault bike, barbell complexes, EMOM cardio
- Zone MetCon X : WODs fonctionnels, mouvements gymnastics, kettlebell, combinaisons
- Adapter le volume et l'intensité au niveau de l'athlète
- Retourner UNIQUEMENT le JSON, sans texte avant ou après`
}

interface AthxUserPromptParams extends GenerateAthxSessionDto {
  userLevel?: string
  oneRepMaxes?: { lift: string; value: number }[]
  equipmentAvailable?: string[]
  injuries?: Record<string, unknown>
}

export function buildAthxUserPrompt(params: AthxUserPromptParams): string {
  const typeDesc = SESSION_TYPE_DESCRIPTIONS[params.session_type] || params.session_type
  const level = params.level || params.userLevel || 'intermediate'

  let prompt = `Génère une séance de préparation ATHX avec ces paramètres :

- Type : ${params.session_type} — ${typeDesc}
- Durée : ${params.duration_minutes} minutes
- Niveau : ${level}`

  if (params.target_zones) {
    prompt += `\n- Zones ciblées : ${params.target_zones}`
  }

  if (params.oneRepMaxes && params.oneRepMaxes.length > 0) {
    const maxes = params.oneRepMaxes.map((m) => `${m.lift}: ${m.value}kg`).join(', ')
    prompt += `\n- 1RMs athlète : ${maxes}`
  }

  if (params.equipmentAvailable && params.equipmentAvailable.length > 0) {
    prompt += `\n- Équipement disponible : ${params.equipmentAvailable.join(', ')}`
  }

  const injuryEntries = params.injuries ? Object.entries(params.injuries).filter(([, v]) => v) : []
  if (injuryEntries.length > 0) {
    prompt += `\n- Blessures / limitations : ${injuryEntries.map(([k]) => k).join(', ')}`
  }

  if (params.competition_date) {
    prompt += `\n- Compétition : ${params.competition_date}`
  }

  if (params.additional_instructions) {
    prompt += `\n- Instructions : ${params.additional_instructions}`
  }

  return prompt
}
