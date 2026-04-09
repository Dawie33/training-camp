import { GenerateHyroxSessionDto, HYROX_ALTERNATIVES, HYROX_STATIONS } from '../dto/hyrox.dto'

const STATION_LABELS: Record<string, string> = {
  ski_erg: 'SkiErg (1000m)',
  sled_push: 'Sled Push (50m)',
  sled_pull: 'Sled Pull (50m)',
  burpee_broad_jumps: 'Burpee Broad Jumps (80m)',
  rowing: 'Rowing (1000m)',
  farmers_carry: 'Farmers Carry (200m)',
  sandbag_lunges: 'Sandbag Lunges (100m)',
  wall_balls: 'Wall Balls (100 reps)',
}

export function buildHyroxSystemPrompt(): string {
  const stationList = HYROX_STATIONS.map((s) => `- ${STATION_LABELS[s]}`).join('\n')
  const alternativesList = Object.entries(HYROX_ALTERNATIVES)
    .map(([s, alts]) => `- ${s} → ${alts.join(', ')}`)
    .join('\n')

  return `Tu es un coach HYROX certifié, expert en préparation à la compétition HYROX.

HYROX est une compétition de fitness qui se déroule toujours dans le même ordre :
8 rounds de : 1 km de course + 1 station fonctionnelle

Ordre des stations :
${stationList}

Alternatives par station (si l'équipement manque) :
${alternativesList}

Ta mission est de générer des séances de préparation HYROX en JSON.

# STRUCTURE JSON REQUISE

\`\`\`json
{
  "name": "Nom court de la séance",
  "session_type": "full_simulation|station_prep|run_prep|mixed",
  "duration_minutes": 60,
  "difficulty": "beginner|intermediate|advanced|elite",
  "description": "Objectif de la séance (2-3 phrases)",
  "blocks": [
    {
      "type": "warmup|run_work|station_work|mixed|cooldown",
      "label": "Nom du bloc",
      "duration_minutes": 10,
      "target_stations": ["ski_erg", "rowing"],
      "exercises": [
        {
          "name": "Nom de l'exercice ou station",
          "sets": 3,
          "reps": "10",
          "distance": "50m",
          "duration": "3min",
          "rest": "90s",
          "intensity": "80%",
          "alternative": "Alternative si pas l'équipement",
          "notes": "Conseil technique"
        }
      ],
      "notes": "Consignes du bloc"
    }
  ],
  "equipment_notes": "Quels équipements sont utilisés et quelles alternatives proposées",
  "coaching_tips": "Conseils techniques importants pour cette séance",
  "race_strategy": "Comment cette séance améliore les performances en compétition HYROX"
}
\`\`\`

# RÈGLES IMPORTANTES
- Toujours un bloc warmup et cooldown
- Pour full_simulation : simuler des rounds run + station avec volumes réduits
- Pour station_prep : se concentrer sur les stations ciblées avec variations et progressions
- Pour run_prep : travail spécifique course à pied avec intensités HYROX (effort maintenu entre stations)
- TOUJOURS indiquer l'alternative si l'équipement manque dans le champ "alternative"
- Retourner UNIQUEMENT le JSON`
}

interface HyroxUserPromptParams extends GenerateHyroxSessionDto {
  userLevel?: string
  injuries?: Record<string, unknown>
}

export function buildHyroxUserPrompt(params: HyroxUserPromptParams): string {
  const level = params.level || params.userLevel || 'intermediate'
  const equipment = params.equipment_available?.length
    ? `Équipement disponible : ${params.equipment_available.join(', ')}`
    : 'Équipement non précisé — proposer des alternatives pour chaque station'

  let prompt = `Génère une séance de préparation HYROX :

- Type : ${params.session_type}
- Durée : ${params.duration_minutes} minutes
- Niveau : ${level}
- ${equipment}`

  if (params.stations_to_work?.length) {
    const labels = params.stations_to_work.map((s) => STATION_LABELS[s] || s).join(', ')
    prompt += `\n- Stations à cibler : ${labels}`
  }

  const injuryEntries = params.injuries ? Object.entries(params.injuries).filter(([, v]) => v) : []
  if (injuryEntries.length > 0) {
    prompt += `\n- Blessures / limitations : ${injuryEntries.map(([k]) => k).join(', ')}`
  }

  if (params.additional_instructions) {
    prompt += `\n- Instructions : ${params.additional_instructions}`
  }

  return prompt
}
