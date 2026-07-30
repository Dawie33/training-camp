import type { UserAIContext } from 'src/workouts/services/user-context.service'

export interface ProgramGenerationParams {
  program_type: string
  duration_weeks: number
  sessions_per_week: number
  target_level: string
  focus?: string
  box_days_per_week?: number
}

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  strength_building: 'Développement de la force',
  endurance_base: "Base d'endurance",
  competition_prep: 'Préparation compétition',
  off_season: 'Intersaison / récupération active',
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant (moins de 1 an de CrossFit)',
  intermediate: 'Intermédiaire (1-3 ans de CrossFit)',
  advanced: 'Avancé (3+ ans, maîtrise des mouvements)',
}

function buildAthleteContextSection(context: UserAIContext): string {
  const lines: string[] = ['## Contexte athlète']

  lines.push(`- Niveau sport : ${context.sport_level}`)

  if (context.height) lines.push(`- Taille : ${context.height} cm`)
  if (context.weight) lines.push(`- Poids : ${context.weight} kg`)

  if (context.oneRepMaxes.length > 0) {
    lines.push('- 1RM :')
    context.oneRepMaxes.forEach((orm) => lines.push(`  - ${orm.lift} : ${orm.value} kg`))
  }

  if (Object.keys(context.benchmarkResults).length > 0) {
    lines.push('- Benchmarks :')
    Object.entries(context.benchmarkResults).forEach(([name, data]) => {
      const resultStr = Object.entries(data.result)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
      lines.push(`  - ${name} : ${resultStr} (${data.date})`)
    })
  }

  if (context.equipment_available.length > 0) {
    lines.push(`- Équipement disponible : ${context.equipment_available.join(', ')}`)
  }

  if (Object.keys(context.global_goals).some((k) => context.global_goals[k])) {
    const goals = Object.entries(context.global_goals)
      .filter(([, v]) => v)
      .map(([k]) => k)
    lines.push(`- Objectifs déclarés : ${goals.join(', ')}`)
  }

  if (context.recentSessions.length > 0) {
    const sportLabels: Record<string, string> = {
      crossfit: 'CrossFit', running: 'Running',
      strength: 'Musculation', biking: 'Vélo',
    }
    lines.push(`- Séances récentes tous sports (${context.recentSessions.length} sur 21 jours) :`)
    context.recentSessions.slice(0, 7).forEach((s) => {
      const label = sportLabels[s.sport] ?? s.sport
      lines.push(
        `  - ${s.date} — ${label} : ${s.workout_type || 'inconnu'}, ${s.duration_minutes} min, effort ${s.perceived_effort ?? 'N/A'}/10`,
      )
    })
  }

  if (context.recentAnalyses.length > 0) {
    const levelLabel: Record<string, string> = {
      pr: 'PR', above_average: 'au-dessus de la moyenne', average: 'dans la moyenne',
      below_average: 'en dessous de la moyenne', first_time: 'première fois',
    }
    lines.push('- Analyses IA récentes (performances + feedback coach) :')
    context.recentAnalyses.forEach((a) => {
      lines.push(`  - ${a.date} — ${a.workout_name} (${levelLabel[a.performance_level] ?? a.performance_level})`)
      if (a.improvements.length > 0) lines.push(`    → À travailler : ${a.improvements.join(', ')}`)
      if (a.next_steps) lines.push(`    → Prochaine étape : ${a.next_steps}`)
    })
  }

  if (context.progressionReports && context.progressionReports.length > 0) {
    lines.push('- Bilans de progression IA multi-semaines :')
    context.progressionReports.forEach((r) => {
      const trendLabel = r.overall_trend === 'improving' ? '↑ progression' : r.overall_trend === 'declining' ? '↓ baisse' : '→ stable'
      lines.push(`  - [${r.sport.toUpperCase()} — ${r.period_months} mois — ${trendLabel}]`)
      if (r.weak_points.length > 0) lines.push(`    Points à travailler : ${r.weak_points.join(', ')}`)
      if (r.recommendations.length > 0) lines.push(`    Recommandations : ${r.recommendations.slice(0, 2).join(' / ')}`)
      if (r.overall_fitness_level) lines.push(`    Condition globale : ${r.overall_fitness_level}`)
    })
    lines.push('→ Prioritise dans le programme les lacunes identifiées par les bilans.')
  }

  return lines.join('\n')
}

export function buildProgramGeneratorSystemPrompt(programType?: string): string {
  const isStrengthOnly = programType === 'strength_building'
  const complementaryRule = isStrengthOnly
    ? `- Programme ORIENTE FORCE : chaque seance commence par le travail de force / halterophilie (squat, deadlift, presses, olympic lifts + accessoires cibles) comme PIECE MAITRESSE (~35-45 min).
- APRES la force, ajoute TOUJOURS un WOD CrossFit COURT (8-15 min) dans le champ "conditioning", cible sur la MEME zone / le meme patron musculaire que la force du jour :
  - force bas du corps -> finisher bas du corps (ex: air squats, walking lunges, box jumps, KB swings, wall balls),
  - force haut du corps (press/tirage) -> finisher haut du corps (ex: push-ups, DB shoulder press, pull-ups, ring rows),
  - full body / olympic -> finisher mixte cousin du mouvement travaille.
- Le WOD est un FINISHER lie a la force, pas une piece longue independante : calibre sa duree pour que le TOTAL de la seance tienne dans ~60 min.
- "estimated_duration" = 60. "focus" = "mixed" (ou "recovery" pour un deload leger, conditioning alors null).`
    : `- Toujours inclure un stimulus complementaire (force + condo ou skill + condo)`

  return `Tu es un coach CrossFit certifie Level 3+ specialise dans la programmation periodisee et le developpement de la performance.

Ta mission est de generer des programmes d'entrainement structures et progressifs en format JSON strict.

# STRUCTURE JSON REQUISE

Tu dois TOUJOURS retourner UNIQUEMENT ce JSON, sans texte avant ni apres :

\`\`\`json
{
  "name": "Nom du programme",
  "description": "Description courte du programme (2-3 phrases)",
  "objectives": "Objectifs specifiques et mesurables du programme",
  "phases": [
    {
      "phase_number": 1,
      "name": "Nom de la phase (ex: Accumulation, Build, Peak)",
      "weeks": [1, 2, 3, 4],
      "description": "Description de cette phase et son objectif",
      "sessions": [
        {
          "session_in_week": 1,
          "title": "Titre de la seance (ex: Force Lower Body)",
          "focus": "strength|conditioning|skill|mixed|recovery",
          "estimated_duration": 60,
          "strength_work": {
            "movements": [
              {
                "name": "Back Squat",
                "sets": 5,
                "reps": "5",
                "intensity": "75% 1RM",
                "rest": "3min",
                "notes": "Pause de 2s en bas"
              }
            ]
          },
          "conditioning": {
            "type": "amrap|for_time|emom|tabata|rounds_for_time|chipper",
            "duration_minutes": 12,
            "rounds": null,
            "movements": [
              { "name": "Wall Ball Shots", "reps": 15, "weight": "9kg" },
              { "name": "Box Jumps", "reps": 10 },
              { "name": "KB Swings", "reps": 12, "weight": "24kg" }
            ],
            "score_type": "rounds_and_reps|time|weight|calories|reps",
            "scaling_notes": "Reduire charge ou reps si necessaire"
          },
          "skill_work": null,
          "coach_notes": "Focus sur la technique avant la charge"
        }
      ]
    }
  ],
  "progression_notes": "Comment progresser au fil du programme",
  "coach_notes": "Notes generales du coach"
}
\`\`\`

# REGLES STRICTES

1. Le nombre de sessions dans chaque phase doit correspondre EXACTEMENT au parametre sessions_per_week demande.
2. session_in_week va de 1 a sessions_per_week.
3. Toutes les semaines du programme doivent apparaitre dans les tableaux "weeks" des phases.
4. La somme de toutes les semaines dans toutes les phases = duration_weeks.
5. strength_work et conditioning peuvent etre null si non applicable (ex: seance recovery).
6. Les champs "reps" peuvent etre un nombre (10) ou une chaine ("8-12", "max").
7. JAMAIS de texte hors JSON.
8. Pour strength_work, conditioning et skill_work : mets la valeur null si le bloc ne s'applique pas. N'emets JAMAIS un objet vide {} ni un objet partiel. Si tu inclus skill_work, il DOIT contenir "name" et "description" non vides.

# METHODOLOGIE

- Phase 1 (Accumulation) : volume eleve, intensite moderee, technique prioritaire
- Phase 2 (Build) : volume reduit, intensite augmentee
- Phase 3 (Peak/Realisation) : volume bas, intensite maximale, expression de la forme
${complementaryRule}
- Progression semaine par semaine dans chaque phase (intensite ou volume)
- Adapter au niveau de l'athlete et a son contexte CrossFit box`
}

export function buildProgramGeneratorUserPrompt(params: ProgramGenerationParams, context: UserAIContext): string {
  const programTypeLabel = PROGRAM_TYPE_LABELS[params.program_type] || params.program_type
  const levelLabel = LEVEL_LABELS[params.target_level] || params.target_level

  const phases = computePhaseCount(params.duration_weeks)

  const athleteSection = buildAthleteContextSection(context)

  const boxNote =
    params.box_days_per_week && params.box_days_per_week > 0
      ? `\n**Important** : L'athlete s'entraine aussi en box CrossFit ~${params.box_days_per_week} jours/semaine (WODs imprévisibles). Ton programme couvre UNIQUEMENT les ${params.sessions_per_week} seances personnelles. Evite de surcharger les jours de repos.`
      : ''

  const focusNote = params.focus ? `\n**Focus particulier** : ${params.focus}` : ''

  const strengthOnlyNote =
    params.program_type === 'strength_building'
      ? `\n**Programme force + finisher lie** : chaque seance = travail de force en PIECE MAITRESSE, PUIS un WOD CrossFit COURT (8-15 min) cible sur la MEME zone musculaire (force bas du corps -> finisher bas du corps, force haut du corps -> finisher haut du corps). Objectif seance ~60 min : "estimated_duration" = 60, "focus" = "mixed", "conditioning" renseigne mais court (finisher, pas metcon long independant).`
      : ''

  return `Genere un programme d'entrainement CrossFit avec ces parametres :

**Type** : ${programTypeLabel}
**Durée** : ${params.duration_weeks} semaines
**Séances par semaine** : ${params.sessions_per_week} seances personnelles${boxNote}
**Niveau** : ${levelLabel}${focusNote}${strengthOnlyNote}

**Structure de phases suggérée** : ${phases}

${athleteSection}

Cree un programme periodise, progressif et adapte au profil de l'athlete.
Chaque phase doit avoir une logique claire (accumulation → construction → realisation).
Les seances doivent etre complementaires dans une meme semaine (pas deux seances identiques consécutives).

Retourne UNIQUEMENT le JSON, sans texte avant ou apres.`
}

function computePhaseCount(durationWeeks: number): string {
  if (durationWeeks <= 4) return '1 phase (4 semaines)'
  if (durationWeeks <= 6) return '2 phases (3+3 semaines ou 4+2)'
  if (durationWeeks <= 8) return '2-3 phases (3+3+2 ou 4+4 semaines)'
  return '3-4 phases (accumulation + build + peak + deload)'
}

export interface BonusSessionParams {
  program_type: string
  target_level: string
  week_focuses: string[]
  focus?: string
}

export function buildBonusSessionSystemPrompt(): string {
  return `Tu es un coach CrossFit certifie Level 3+. Tu generes UNE seule seance d'entrainement complementaire au format JSON strict.

# STRUCTURE JSON REQUISE

Retourne UNIQUEMENT cet objet JSON (une seule seance), sans texte avant ni apres :

\`\`\`json
{
  "session_in_week": 99,
  "title": "Titre de la seance",
  "focus": "strength|conditioning|skill|mixed|recovery",
  "estimated_duration": 45,
  "strength_work": {
    "movements": [
      { "name": "Front Squat", "sets": 4, "reps": "6", "intensity": "70% 1RM", "rest": "2min", "notes": null }
    ]
  },
  "conditioning": {
    "type": "amrap|for_time|emom|tabata|rounds_for_time|chipper",
    "duration_minutes": 12,
    "rounds": null,
    "movements": [ { "name": "Row", "calories": 12 }, { "name": "Burpees", "reps": 10 } ],
    "score_type": "rounds_and_reps|time|weight|calories|reps",
    "scaling_notes": "..."
  },
  "skill_work": null,
  "coach_notes": "..."
}
\`\`\`

# REGLES STRICTES
1. UN SEUL objet seance (pas de tableau, pas de phases).
2. "session_in_week" doit valoir 99 (il sera reassigné automatiquement).
3. strength_work et conditioning peuvent etre null selon le focus.
4. "reps" peut etre un nombre ou une chaine.
5. JAMAIS de texte hors JSON.
6. Pour strength_work, conditioning et skill_work : mets null si le bloc ne s'applique pas. N'emets JAMAIS un objet vide {} ni partiel. Si skill_work est present, "name" et "description" doivent etre non vides.`
}

export function buildBonusSessionUserPrompt(params: BonusSessionParams, context: UserAIContext): string {
  const programTypeLabel = PROGRAM_TYPE_LABELS[params.program_type] || params.program_type
  const levelLabel = LEVEL_LABELS[params.target_level] || params.target_level
  const focusesStr = params.week_focuses.length > 0 ? params.week_focuses.join(', ') : 'aucune'
  const focusNote = params.focus ? `\n**Souhait de l'athlete pour cette seance bonus** : ${params.focus}` : ''

  const athleteSection = buildAthleteContextSection(context)

  const isStrengthOnly = params.program_type === 'strength_building'
  const complementarityRules = isStrengthOnly
    ? `Regle (programme FORCE) : la seance bonus reste orientee force, avec un finisher lie.
- Force en piece maitresse, PUIS un WOD CrossFit court (8-15 min) cible sur la meme zone musculaire que la force du jour.
- Choisis de preference une zone complementaire aux focus deja couverts cette semaine (ex: bas du corps si la semaine a surtout fait du haut du corps).
- "focus" = "mixed" (ou "skill" si seance purement technique, conditioning alors null). Duree raisonnable (~45-60 min).`
    : `Regle de complementarite : choisis un focus qui EQUILIBRE la semaine.
- Si la semaine est deja tres orientee force → propose du conditioning, du cardio (endurance zone 2) ou du skill.
- Si la semaine est deja tres cardio → propose de la force accessoire ou du skill.
- Evite de dupliquer un stimulus deja tres present. Ne surcharge pas les memes groupes musculaires.
- Duree raisonnable (30-50 min) car c'est une seance en plus.`

  return `Genere UNE seance d'entrainement BONUS complementaire, a ajouter a une semaine existante.

**Type de programme** : ${programTypeLabel}
**Niveau** : ${levelLabel}
**Focus deja couverts cette semaine par les autres seances** : ${focusesStr}${focusNote}

${complementarityRules}

${athleteSection}

Retourne UNIQUEMENT le JSON d'une seule seance, sans texte avant ou apres.`
}
