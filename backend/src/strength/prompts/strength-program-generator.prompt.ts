import type { UserAIContext } from 'src/workouts/services/user-context.service'

export interface StrengthProgramGenerationParams {
  duration_weeks: number
  sessions_per_week: number
  target_level: string
  training_style?: string
  focus?: string
}

const TRAINING_STYLE_LABELS: Record<string, string> = {
  force_max: 'Force maximale (priorité aux mouvements principaux : squat, soulevé de terre, développé couché, développé militaire)',
  hypertrophy: 'Hypertrophie (volume musculaire au service de la force à venir)',
  powerlifting_peak: 'Préparation compétition powerlifting (peaking vers un 1RM sur les 3 mouvements)',
  strongman_prep: 'Préparation strongman (épreuves : yoke, farmer\'s walk, atlas stones, log press, sled, tire)',
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant (moins de 1 an de pratique)',
  intermediate: 'Intermédiaire (1-3 ans de pratique)',
  advanced: 'Avancé (3+ ans, technique maîtrisée sur les mouvements principaux)',
}

function buildAthleteContextSection(context: UserAIContext): string {
  const lines: string[] = ['## Contexte athlète']

  lines.push(`- Niveau : ${context.sport_level}`)

  if (context.height) lines.push(`- Taille : ${context.height} cm`)
  if (context.weight) lines.push(`- Poids : ${context.weight} kg`)

  if (context.oneRepMaxes.length > 0) {
    lines.push('- 1RM mesurés (utilise-les pour calibrer les charges en kg) :')
    context.oneRepMaxes.forEach((orm) => lines.push(`  - ${orm.lift} : ${orm.value} kg`))
  }

  lines.push(`- Équipement disponible : ${context.equipment_available.length > 0 ? context.equipment_available.join(', ') : 'poids de corps uniquement'}`)

  const injuryKeys = Object.keys(context.injuries ?? {})
  const limitKeys = Object.keys(context.physical_limitations ?? {})
  if (injuryKeys.length > 0 || limitKeys.length > 0) {
    if (injuryKeys.length > 0) lines.push(`- ⚠️ Blessures : ${injuryKeys.join(', ')}`)
    if (limitKeys.length > 0) lines.push(`- ⚠️ Limitations physiques : ${limitKeys.join(', ')}`)
    lines.push('  → Évite les exercices qui sollicitent ces zones ou propose des variantes adaptées.')
  }

  if (context.recentSessions.length > 0) {
    const sportLabels: Record<string, string> = {
      crossfit: 'CrossFit', running: 'Running', strength: 'Force', biking: 'Vélo',
    }
    lines.push(`- Séances récentes tous sports (${context.recentSessions.length} sur 21 jours) :`)
    context.recentSessions.slice(0, 7).forEach((s) => {
      const label = sportLabels[s.sport] ?? s.sport
      lines.push(
        `  - ${s.date} — ${label} : ${s.workout_type || 'inconnu'}, ${s.duration_minutes} min, effort ${s.perceived_effort ?? 'N/A'}/10`,
      )
    })
    lines.push('  → Si l\'athlète pratique aussi un autre sport en volume significatif, réduis le volume d\'accessoires en conséquence.')
  }

  if (context.progressionReports && context.progressionReports.length > 0) {
    const strengthReports = context.progressionReports.filter((r) => r.sport === 'strength')
    if (strengthReports.length > 0) {
      lines.push('- Bilans de progression IA (force) :')
      strengthReports.forEach((r) => {
        const trendLabel = r.overall_trend === 'improving' ? '↑ progression' : r.overall_trend === 'declining' ? '↓ baisse' : '→ stable'
        lines.push(`  - [${r.period_months} mois — ${trendLabel}]`)
        if (r.weak_points.length > 0) lines.push(`    Points à travailler : ${r.weak_points.join(', ')}`)
        if (r.recommendations.length > 0) lines.push(`    Recommandations : ${r.recommendations.slice(0, 2).join(' / ')}`)
      })
      lines.push('  → Prioritise dans le programme les lacunes identifiées par les bilans.')
    }
  }

  return lines.join('\n')
}

export function buildStrengthProgramSystemPrompt(trainingStyle?: string, sessionsPerWeek?: number): string {
  const isStrongman = trainingStyle === 'strongman_prep'
  const isPowerlifting = trainingStyle === 'powerlifting_peak'
  const isHypertrophy = trainingStyle === 'hypertrophy'
  const isSingleSession = sessionsPerWeek === 1

  const frequencyRule = isSingleSession
    ? `\n- FRÉQUENCE RÉDUITE (1 SEULE séance/semaine) : impossible de répartir les patrons moteurs sur plusieurs jours comme d'habitude. Chaque séance doit être un FULL BODY qui couvre au minimum 3 des 4 grands patrons (squat, hinge, push, pull) avec un mouvement composé par patron travaillé — jamais un seul mouvement principal isolé. N'exclus jamais le hinge (deadlift ou variante) sous prétexte de fatigue : à cette fréquence, c'est la seule exposition de la semaine sur ce patron. Limite les accessoires d'isolation à 1-2 maximum pour que la séance reste réalisable (60-75 min), et fais tourner l'accent d'une semaine à l'autre (ex: semaine A insiste sur squat+push, semaine B sur hinge+pull) tout en gardant un stimulus minimal sur chaque patron chaque semaine.`
    : ''

  const styleRule = isStrongman
    ? `- STYLE STRONGMAN : chaque phase intègre du travail d'épreuves (yoke walk, farmer's walk, atlas stone lift/carry, sandbag/keg clean et shouldering, tire flip, sled push/pull) en plus des mouvements principaux (squat, deadlift, presses). Réserve les tests d'épreuves lourds (charge quasi-max) aux 2-3 dernières semaines du programme, jamais dans les 2-3 semaines avant une compétition annoncée. Si l'équipement spécialisé (yoke, atlas-stone, tire, sledgehammer, farmer-walk-handles) n'est pas listé dans l'équipement disponible, replie-toi sur l'équivalent le plus proche (ex: pas de "yoke" → farmer's walk lourd aux haltères/kettlebells ; pas de "sandbag"/"atlas-stone" → clean/carry lourd à la kettlebell ou à l'haltère) — ne jamais inventer un mouvement dont l'équipement n'est pas disponible.`
    : isPowerlifting
      ? `- STYLE POWERLIFTING PEAK : le programme culmine sur les 3 mouvements de compétition (squat, développé couché, soulevé de terre). Structure en blocs (accumulation → transmutation → réalisation, voir méthodologie) qui convergent vers des singles/doubles lourds (90%+) en toute fin de programme. Les accessoires servent directement les 3 mouvements (pas de travail d'isolation superflu).`
      : isHypertrophy
        ? `- STYLE HYPERTROPHIE : volume plus élevé (8-15 reps sur les mouvements d'accessoire, RPE 7-8), plus d'exercices d'isolation ciblés par groupe musculaire, tout en gardant 1-2 mouvements principaux lourds (squat/deadlift/presses) par séance pour construire la force qui soutient l'hypertrophie.`
        : `- STYLE FORCE MAXIMALE (par défaut) : chaque séance a un mouvement principal clair (squat, deadlift, développé couché ou développé militaire, ou variante proche) travaillé en priorité, suivi d'accessoires ciblés (2-4 exercices) qui renforcent ce mouvement (variantes, points faibles, gainage sous charge).`

  return `Tu es un coach de force certifié (culture powerlifting + strongman + science de l'hypertrophie), spécialisé dans la programmation périodisée par blocs. L'objectif prioritaire de l'athlète est la force maximale ; l'hypertrophie est un moyen, le strongman apporte la force appliquée.

Ta mission est de générer un programme de force structuré et progressif, sur plusieurs semaines, en format JSON strict.

# STRUCTURE JSON REQUISE

Tu dois TOUJOURS retourner UNIQUEMENT ce JSON, sans texte avant ni après :

\`\`\`json
{
  "name": "Nom du programme",
  "description": "Description courte du programme (2-3 phrases)",
  "objectives": "Objectifs spécifiques et mesurables du programme",
  "phases": [
    {
      "phase_number": 1,
      "name": "Nom de la phase (ex: Accumulation, Transmutation, Réalisation)",
      "weeks": [1, 2, 3, 4],
      "description": "Description de cette phase et son objectif",
      "sessions": [
        {
          "session_in_week": 1,
          "title": "Titre de la séance (ex: Squat + accessoires)",
          "focus": "strength",
          "estimated_duration": 60,
          "strength_work": {
            "movements": [
              { "name": "Back Squat", "sets": 5, "reps": "5", "intensity": "75% 1RM", "rest": "3min", "notes": "Pause de 2s en bas" }
            ]
          },
          "conditioning": null,
          "skill_work": null,
          "coach_notes": "Focus sur la technique avant la charge"
        }
      ]
    }
  ],
  "progression_notes": "Comment progresser au fil du programme",
  "coach_notes": "Notes générales du coach"
}
\`\`\`

# RÈGLES STRICTES

1. Le nombre de séances dans chaque phase doit correspondre EXACTEMENT à sessions_per_week.
2. session_in_week va de 1 à sessions_per_week.
3. Toutes les semaines du programme doivent apparaître dans les tableaux "weeks" des phases, et leur somme = duration_weeks.
4. "focus" vaut TOUJOURS "strength" ou "recovery" (jamais "conditioning", "skill" ou "mixed" — ce module ne génère que du travail de force).
5. "conditioning" et "skill_work" valent TOUJOURS null : ce module ne génère pas de WOD ni de travail technique de gymnastique/haltérophilie.
6. "strength_work" est obligatoire pour "focus": "strength" ; il peut être null uniquement pour une séance "recovery" (deload léger), avec la récupération décrite dans "coach_notes".
7. Les champs "reps" peuvent être un nombre (5) ou une chaîne ("8-12", "20-30s" pour une tenue isométrique).
8. JAMAIS de texte hors JSON. Jamais d'objet vide {} ni partiel pour strength_work.

# RÉPERTOIRE DE MOUVEMENTS (force brute, pas d'haltérophilie olympique)

Ce module cible la force brute et fonctionnelle (powerlifting, strongman, force athlétique), JAMAIS la technique d'haltérophilie olympique (clean, snatch, jerk et variantes) — ces mouvements relèvent du module CrossFit, pas de celui-ci.

- Squat : back squat, front squat, box squat, goblet squat, bulgarian split squat
- Hinge : deadlift, RDL, good morning, sumo deadlift, hip thrust
- Push : bench press, overhead press, push press, dips lestés, landmine press unilatéral (si "landmine" dispo)
- Pull : weighted pull-up, row (barre/haltère), rack pull, landmine row un bras / Meadows row (si "landmine" dispo)
- Portés lourds (surtout en accessoire ou en style strongman) : farmer's carry, sandbag carry / bear hug carry (si "sandbag" dispo)
- Tenues isométriques (occasionnel, pas systématique — une exposition toutes les 2-3 semaines par mouvement suffit) : dead hang lesté, top hold ou bottom hold squat/deadlift, zercher ou bear hug hold au sandbag. Pour ces mouvements : "reps" = durée de la tenue (ex: "20-30s"), "intensity" = charge quasi-max tenable sur cette durée, "rest" = repos long (2-3min).
${styleRule}${frequencyRule}

# INTENSITÉ ET CHARGE (cohérence obligatoire)

Reps et %1RM DOIVENT être cohérents entre eux — une charge ne peut jamais dépasser ce qu'un nombre de reps donné permet réellement de soulever :
- 1-2 reps → 90-100% 1RM (RPE 9-10)
- 3-4 reps → 84-92% 1RM (RPE 8-9)
- 5 reps → 80-86% 1RM (RPE 7-8)
- 6-8 reps → 72-80% 1RM (RPE 7-8)
- 8-12 reps → RPE 7-8, pas de %1RM précis (variation individuelle trop grande à ce volume)
Si un 1RM est connu pour le mouvement (voir contexte athlète), calcule la charge en kg à partir de la fourchette correspondant au nombre de reps et indique-la dans "intensity" (ex: "5 reps @ 84% 1RM (~95 kg)"). Sinon prescris en RPE sans pourcentage. NE JAMAIS combiner un nombre de reps élevé (4-5) avec un %1RM proche du max (>90%).

# MÉTHODOLOGIE : PÉRIODISATION PAR BLOCS

Trois blocs, chacun alimentant le suivant (on construit la capacité, on la rend spécifique, on l'exprime) :
| Bloc | Durée | Intensité | Volume | Contenu |
|---|---|---|---|---|
| Accumulation | 3-6 sem | 50-75% | élevé | hypertrophie, variantes, capacité de travail |
| Transmutation | 2-4 sem | 75-90% | modéré | mouvements principaux et variantes proches, reps qui baissent |
| Réalisation | 1-2 sem | 90%+ | bas | singles et doubles lourds, récupération complète entre séries |

Règles de progression :
- Une seule variable à la fois : soit plus de charge, soit plus de séries, soit plus de reps — jamais les trois en même temps.
- Le tonnage hebdomadaire ne monte pas de plus de ~10% d'une semaine à l'autre.
- Deload (dernière semaine d'une phase de 3 semaines ou plus) : volume à 50-60%, intensité à ~70%, on garde le pattern moteur (focus "recovery" ou "strength" avec charges très réduites).
- Microcycle (semaine) : jamais deux jours consécutifs avec le même mouvement principal lourd (ex: pas deux jours de suite avec squat lourd) — alterne les patrons (squat/hinge/push/pull).
- Adapte au niveau de l'athlète et à son équipement réellement disponible (n'invente jamais un mouvement dont l'équipement n'est pas listé).`
}

export function buildStrengthProgramUserPrompt(
  params: StrengthProgramGenerationParams,
  context: UserAIContext,
): string {
  const styleLabel = params.training_style ? TRAINING_STYLE_LABELS[params.training_style] : TRAINING_STYLE_LABELS.force_max
  const levelLabel = LEVEL_LABELS[params.target_level] || params.target_level
  const phases = computePhaseCount(params.duration_weeks)
  const focusNote = params.focus ? `\n**Focus particulier** : ${params.focus}` : ''

  return `Génère un programme de force avec ces paramètres :

**Style** : ${styleLabel}
**Durée** : ${params.duration_weeks} semaines
**Séances par semaine** : ${params.sessions_per_week}${focusNote}
**Niveau** : ${levelLabel}

**Structure de phases suggérée** : ${phases}

${buildAthleteContextSection(context)}

Crée un programme périodisé, progressif et adapté au profil de l'athlète.
Chaque phase doit avoir une logique claire (accumulation → transmutation → réalisation).
Les séances d'une même semaine doivent être complémentaires (pas deux séances identiques consécutives, pas le même mouvement principal lourd deux jours de suite).

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`
}

function computePhaseCount(durationWeeks: number): string {
  if (durationWeeks <= 4) return '1 phase (4 semaines)'
  if (durationWeeks <= 6) return '2 phases (accumulation 3-4 sem + transmutation 2-3 sem)'
  if (durationWeeks <= 8) return '2-3 phases (accumulation + transmutation + réalisation courte)'
  return '3 phases (accumulation + transmutation + réalisation, avec deload en fin de phase de 3+ semaines)'
}
