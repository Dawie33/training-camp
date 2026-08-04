import { UserAIContext } from 'src/workouts/services/user-context.service'
import type { ProgramRecommendationContext } from 'src/training-programs/training-programs.service'
import { SessionStats } from '../schemas/recommendation.schema'

const SPORT_LABELS: Record<string, string> = {
  crossfit: 'CrossFit',
  running: 'Running',
  biking: 'Vélo',
  strength: 'Force',
}

export function buildRecommendationSystemPrompt(): string {
  return `Tu es un coach cross-training expert avec une vision globale de l'entraînement multi-sport.

Ta mission est d'analyser l'historique d'entraînement complet d'un athlète (tous sports confondus) et de recommander LA prochaine séance optimale, en appliquant les principes scientifiques du cross-training.

# PRINCIPES DE PROGRAMMATION CROSS-TRAINING

## Équilibre des modalités
Un programme équilibré sur 3 semaines doit couvrir :
- **Cardio/endurance** : Running easy/long_run ou Biking endurance Z2 (2-3x/3 semaines minimum)
- **Force/puissance** : Strength ou CrossFit strength_max (1-2x/semaine)
- **Conditionnement métabolique** : CrossFit conditioning, Biking intervals (2-3x/semaine)
- **Technique/seuil** : CrossFit technique_metcon, Biking sweet_spot (1x/semaine)

## Règles de récupération
- RPE 9-10 hier → recommander séance légère ou repos
- 3 séances haute intensité en 5 jours → recommander récupération active (running easy, strength légère)
- Pas de 2 séances de même sport à haute intensité 2 jours de suite

## Règles d'urgence (days_since_last)
- **Urgence haute** : > 14 jours sans running, > 10 jours sans force, > 14 jours sans vélo
- **Urgence moyenne** : 8-14 jours sans une modalité
- **Urgence faible** : 3-7 jours sans une modalité (rotation normale)

## Types de séance par sport
- **crossfit** : technique_metcon, strength_max, conditioning, benchmark, vo2max
- **running** : easy, tempo, intervals, long_run, fartlek
- **biking** : endurance, sweet_spot, intervals, ftp_test, recovery, race
- **strength** : strength, hypertrophy, endurance, power
- **rest** : récupération active (type "active_recovery")

## Durée suggérée par sport et niveau
- CrossFit : 45-60 min (beginner: 35-45 min)
- Running : 30-60 min selon le type (easy: 30-40, intervals: 40-50, long_run: 60-90)
- Vélo : 45-90 min (endurance: 60-90, sweet_spot: 60-75, intervals: 60, recovery: 40-50)
- Strength : 50-70 min

# ALIGNEMENT AVEC LE PROGRAMME ACTIF (PRIORITAIRE)

Si l'athlète suit un programme structuré, celui-ci est LA RÉFÉRENCE. Ta recommandation doit le servir, jamais le contredire :

- **Une séance est programmée aujourd'hui** → recommande-la telle quelle. Mappe son "focus" vers recommended_sport : strength→strength, conditioning→crossfit, skill→crossfit, mixed→crossfit, recovery→rest. Reprends sa durée estimée. Mets aligned_with_program = true.
- **Programme actif mais rien de programmé aujourd'hui** → propose une séance qui COMPLÈTE les focus restants de la semaine et respecte la phase en cours (ex. phase "force max" → strength lourd prioritaire ; phase "endurance de base" → cardio Z2). aligned_with_program = true.
- **Phase de deload / récupération** → réduis nettement intensité et volume, privilégie récupération active ou repos, même si une modalité est "en retard".
- **Aucun programme actif** → applique les principes cross-training génériques ci-dessus. aligned_with_program = false.

Les règles d'urgence (days_since_last) restent secondaires face au programme : on ne casse pas la périodisation pour rattraper une modalité négligée.

# FORMAT JSON REQUIS

Retourne UNIQUEMENT ce JSON :
\`\`\`json
{
  "recommended_sport": "crossfit|running|biking|strength|rest",
  "recommended_type": "type de séance spécifique",
  "urgency": "low|medium|high",
  "reason": "1-2 phrases directes expliquant POURQUOI cette séance maintenant",
  "coaching_insight": "Explication pédagogique : ce que cette séance apporte dans la progression globale, comment elle complémente les séances récentes",
  "suggested_duration": 45,
  "suggested_focus": "focus optionnel (ex: 'legs', 'upper body', 'vo2max') ou null",
  "suggested_instructions": "Instructions pré-remplies pour le formulaire de génération, ou null",
  "aligned_with_program": true
}
\`\`\`

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`
}

export function buildRecommendationUserPrompt(
  ctx: UserAIContext,
  stats: SessionStats,
  program?: ProgramRecommendationContext,
): string {
  const sportLabels = SPORT_LABELS
  const levelMap: Record<string, string> = {
    beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé', elite: 'Elite',
  }

  const lines: string[] = []

  // Profil
  lines.push('## PROFIL ATHLÈTE')
  lines.push(`Niveau : ${levelMap[ctx.sport_level] ?? ctx.sport_level}`)

  const goals = Object.keys(ctx.global_goals).filter((k) => ctx.global_goals[k])
  if (goals.length) lines.push(`Objectifs : ${goals.join(', ')}`)

  const injuries = Object.keys(ctx.injuries)
  if (injuries.length) lines.push(`Limitations : ${injuries.join(', ')}`)

  // Programme en cours
  lines.push('')
  lines.push('## PROGRAMME EN COURS')
  if (!program?.has_active_program) {
    lines.push('Aucun programme structuré actif — génération libre selon les principes cross-training.')
  } else {
    lines.push(`Programme : ${program.program_name}${program.objectives ? ` (objectif : ${program.objectives})` : ''}`)
    if (program.current_week && program.total_weeks) {
      lines.push(`Semaine ${program.current_week}/${program.total_weeks}${program.sessions_per_week ? ` — ${program.sessions_per_week} séances/sem.` : ''}`)
    }
    if (program.current_phase) {
      lines.push(`Phase actuelle : ${program.current_phase.name} — ${program.current_phase.description}`)
    }
    if (program.week_planned_focuses?.length) {
      lines.push(`Focus planifiés cette semaine : ${program.week_planned_focuses.join(', ')}`)
    }
    if (program.today_session) {
      lines.push(
        `➡️ Séance PROGRAMMÉE AUJOURD'HUI : « ${program.today_session.title} » (focus ${program.today_session.focus}, ${program.today_session.estimated_duration} min) — recommande-la en priorité.`,
      )
    } else {
      lines.push("Aucune séance spécifiquement programmée aujourd'hui — propose une séance cohérente avec la phase et les focus restants.")
    }
  }

  // Stats globales
  lines.push('')
  lines.push('## RÉPARTITION DES ENTRAÎNEMENTS (21 derniers jours)')
  lines.push(`Total séances : ${stats.total_sessions_21d}`)
  lines.push('Par sport :')

  const ALL_SPORTS = ['crossfit', 'running', 'biking', 'strength']
  for (const sport of ALL_SPORTS) {
    const count = stats.by_sport[sport] ?? 0
    const days = stats.days_since_last[sport]
    const daysStr = days === null ? 'jamais' : days === 0 ? "aujourd'hui" : `il y a ${days}j`
    lines.push(`- ${sportLabels[sport]} : ${count} séance(s) — dernière ${daysStr}`)
  }

  // Sessions récentes
  if (ctx.recentSessions.length > 0) {
    lines.push('')
    lines.push('## SÉANCES RÉCENTES (ordre chronologique inverse)')
    for (const s of ctx.recentSessions.slice(0, 10)) {
      const effort = s.perceived_effort ? `, RPE ${s.perceived_effort}/10` : ''
      const type = s.workout_type ? ` — ${s.workout_type}` : ''
      lines.push(`- ${s.date} : ${sportLabels[s.sport] ?? s.sport}${type}, ${s.duration_minutes}min${effort}`)
    }
  }

  // Bilans de progression
  if (ctx.progressionReports.length > 0) {
    lines.push('')
    lines.push('## BILANS DE PROGRESSION')
    for (const r of ctx.progressionReports.slice(0, 3)) {
      const trend = r.overall_trend === 'improving' ? '↑ progression' : r.overall_trend === 'declining' ? '↓ baisse' : '→ stable'
      lines.push(`- ${sportLabels[r.sport] ?? r.sport} : ${trend}`)
      if (r.weak_points.length) lines.push(`  Points faibles : ${r.weak_points.join(', ')}`)
    }
  }

  lines.push('')
  lines.push('## MISSION')
  lines.push('Analyse cette situation et recommande LA prochaine séance optimale pour cet athlète.')
  lines.push('Sois direct et précis. La recommandation doit être actionnable immédiatement.')

  return lines.join('\n')
}