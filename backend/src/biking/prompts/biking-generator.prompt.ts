import { GenerateBikingSessionDto } from '../dto/biking.dto'

const BIKE_TYPE_DESCRIPTIONS: Record<string, string> = {
    endurance: 'Endurance (Z2, 56-75% FTP, effort conversationnel, base aérobie)',
    sweet_spot: 'Sweet Spot (88-93% FTP, inconfortable mais maintenable, améliore le FTP efficacement)',
    intervals: 'Intervalles (répétitions à haute intensité Z4-Z5, VO2max, avec récupération active)',
    ftp_test: 'Test FTP (20min à effort maximal maintenu, détermine le seuil fonctionnel)',
    recovery: 'Récupération (Z1, très facile, <56% FTP, 30-45min max, jambes libres)',
    race: 'Simulation compétition (gestion de l\'effort, stratégie de puissance, pacing)',
}

export function buildBikingSystemPrompt(): string {
    return `Tu es un coach cyclisme certifié, spécialiste en entraînement structuré basé sur la puissance (FTP).

Ta mission est de générer des séances de vélo personnalisées et détaillées, orientées home trainer ou route, en JSON.

# STRUCTURE JSON REQUISE

\`\`\`json
{
  "name": "Nom court et descriptif de la séance",
  "bike_type": "endurance|sweet_spot|intervals|ftp_test|recovery|race",
  "estimated_duration_minutes": 60,
  "tss_estimate": 65,
  "difficulty": "beginner|intermediate|advanced|elite",
  "description": "Objectif de la séance et bénéfices physiologiques (2-3 phrases)",
  "structure": [
    {
      "phase": "warmup|main|cooldown|recovery",
      "label": "Échauffement progressif",
      "duration_minutes": 10,
      "power_target": "50-65% FTP",
      "target_zone": "zone_1_2",
      "notes": "Augmenter progressivement, inclure 3 accélérations de 10s en fin d'échauff"
    },
    {
      "phase": "main",
      "label": "Bloc Sweet Spot",
      "duration_minutes": 40,
      "power_target": "88-93% FTP",
      "target_zone": "sweet_spot",
      "intervals": [
        {
          "effort_duration": "10min",
          "recovery_duration": "5min",
          "power_description": "88-93% FTP",
          "repetitions": 3
        }
      ],
      "notes": "Maintenir la cadence entre 85-95rpm, ne pas laisser chuter la puissance"
    }
  ],
  "coaching_tips": "Conseils clés pour réussir la séance",
  "recovery_notes": "Alimentation post-effort, récupération, prochaine séance recommandée"
}
\`\`\`

# RÈGLES IMPORTANTES
- Zones de puissance : zone_1 (<56% FTP), zone_1_2 (50-65% FTP, échauffement/récupération), zone_2 (66-75% FTP), zone_3 (76-87% FTP), sweet_spot (88-93% FTP), zone_4 (94-105% FTP), zone_5 (106-120% FTP), zone_6 (>120% FTP)
- TSS ≈ (durée_heures × IF² × 100) ; IF = puissance_normalisée / FTP
- Le champ \`intervals\` n'est présent que pour \`bike_type: intervals\`, \`sweet_spot\` ou \`race\`
- Pour \`endurance\` et \`recovery\` : séance continue sans intervals
- Pour \`ftp_test\` : échauffement 15-20min, bloc principal 20min à effort maximal maintenu (sans intervals), retour au calme 10min
- La somme des \`duration_minutes\` des phases doit égaler \`estimated_duration_minutes\`. Calcule chaque phase depuis les répétitions réelles : répétitions × (durée effort + récupération). Ne pas inventer une durée arbitraire.
- Adapter si FTP fourni : donner les watts exacts en plus du % FTP
- Retourner UNIQUEMENT le JSON, sans texte avant ou après`
}

interface BikingUserPromptParams extends GenerateBikingSessionDto {
    userLevel?: string
    recentSessions?: { bike_type: string; duration_seconds?: number }[]
    injuries?: Record<string, unknown>
    physicalLimitations?: Record<string, unknown>
    trainingPreferences?: { preferred_duration?: number; sessions_per_week?: number }
}

export function buildBikingUserPrompt(params: BikingUserPromptParams): string {
    const bikeTypeDesc = BIKE_TYPE_DESCRIPTIONS[params.bike_type] || params.bike_type
    const level = params.level || params.userLevel || 'intermediate'

    let prompt = `Génère une séance de vélo avec ces paramètres :

- Type de séance : ${params.bike_type} — ${bikeTypeDesc}
- Durée cible : ${params.duration_minutes} minutes
- Niveau athlète : ${level}`

    if (params.ftp_watts) {
        prompt += `\n- FTP : ${params.ftp_watts}W`
    }

    if (params.goal) {
        prompt += `\n- Objectif : ${params.goal}`
    }

    if (params.recentSessions && params.recentSessions.length > 0) {
        const recent = params.recentSessions.slice(0, 3)
        prompt += `\n- Séances récentes : ${recent.map((s) => `${s.bike_type} ${s.duration_seconds ? Math.round(s.duration_seconds / 60) + 'min' : ''}`).join(', ')}`
    }

    const injuryEntries = params.injuries ? Object.entries(params.injuries).filter(([, v]) => v) : []
    if (injuryEntries.length > 0) {
        prompt += `\n- Blessures : ${injuryEntries.map(([k]) => k).join(', ')}`
    }

    const limitationEntries = params.physicalLimitations ? Object.entries(params.physicalLimitations).filter(([, v]) => v) : []
    if (limitationEntries.length > 0) {
        prompt += `\n- Limitations physiques : ${limitationEntries.map(([k]) => k).join(', ')}`
    }

    if (params.trainingPreferences?.sessions_per_week) {
        prompt += `\n- Fréquence d'entraînement : ${params.trainingPreferences.sessions_per_week} séances/semaine`
    }

    if (params.additional_instructions) {
        prompt += `\n- Instructions supplémentaires : ${params.additional_instructions}`
    }

    return prompt
}