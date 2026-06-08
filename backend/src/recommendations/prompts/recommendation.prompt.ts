import { UserAIContext } from 'src/workouts/services/user-context.service'
import { SessionStats } from '../schemas/recommendation.schema'

const SPORT_LABELS: Record<string, string> = {
  crossfit: 'CrossFit',
  running: 'Running',
  hyrox: 'Hyrox',
  strength: 'Musculation',
  athx: 'ATHX',
}

export function buildRecommendationSystemPrompt(): string {
  return `Tu es un coach cross-training expert avec une vision globale de l'entraînement multi-sport.

Ta mission est d'analyser l'historique d'entraînement complet d'un athlète (tous sports confondus) et de recommander LA prochaine séance optimale, en appliquant les principes scientifiques du cross-training.

# PRINCIPES DE PROGRAMMATION CROSS-TRAINING

## Équilibre des modalités
Un programme équilibré sur 3 semaines doit couvrir :
- **Cardio/endurance** : Running ou Hyrox run_prep (2-3x/3 semaines minimum)
- **Force/puissance** : Strength ou CrossFit strength_max (1-2x/semaine)
- **Conditionnement métabolique** : CrossFit conditioning ou Hyrox station_prep (2-3x/semaine)
- **Technique** : CrossFit technique_metcon, ATHX, Hyrox full_simulation (1x/semaine)

## Règles de récupération
- RPE 9-10 hier → recommander séance légère ou repos
- 3 séances haute intensité en 5 jours → recommander récupération active (running easy, strength légère)
- Pas de 2 séances de même sport à haute intensité 2 jours de suite
- Blessures et limitations physiques → adapter le sport et le type de séance en conséquence (éviter les zones touchées)

## Continuité de progression
- Si des analyses post-workout sont disponibles, tenir compte des "prochaines étapes conseillées" pour assurer la continuité
- Si une compétence gymnastic/haltéro est en cours, la prioriser si elle n'a pas été pratiquée depuis > 5 jours
- Prendre en compte l'objectif de séances par semaine pour évaluer si l'athlète est en retard sur son planning

## Règles d'urgence (days_since_last)
- **Urgence haute** : > 14 jours sans running, > 10 jours sans force, > 21 jours sans Hyrox
- **Urgence moyenne** : 8-14 jours sans une modalité
- **Urgence faible** : 3-7 jours sans une modalité (rotation normale)

## Types de séance par sport
- **crossfit** : technique_metcon, strength_max, conditioning, benchmark, vo2max
- **running** : easy, tempo, intervals, long_run, fartlek
- **hyrox** : full_simulation, station_prep, run_prep, mixed
- **strength** : strength, hypertrophy, endurance, power
- **athx** : full_competition, strength_prep, endurance_prep, metcon_prep, mixed
- **rest** : récupération active (type "active_recovery")

## Durée suggérée par sport et niveau
- CrossFit : 45-60 min (beginner: 35-45 min)
- Running : 30-60 min selon le type (easy: 30-40, intervals: 40-50, long_run: 60-90)
- Hyrox : 45-75 min
- Strength : 50-70 min
- ATHX : 50-70 min

# FORMAT JSON REQUIS

Retourne UNIQUEMENT ce JSON :
\`\`\`json
{
  "recommended_sport": "crossfit|running|hyrox|strength|athx|rest",
  "recommended_type": "type de séance spécifique",
  "urgency": "low|medium|high",
  "reason": "1-2 phrases directes expliquant POURQUOI cette séance maintenant",
  "coaching_insight": "Explication pédagogique : ce que cette séance apporte dans la progression globale, comment elle complémente les séances récentes",
  "suggested_duration": 45,
  "suggested_focus": "focus optionnel (ex: 'legs', 'upper body', 'vo2max') ou null",
  "suggested_instructions": "Instructions pré-remplies pour le formulaire de génération, ou null"
}
\`\`\`

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`
}

export function buildRecommendationUserPrompt(ctx: UserAIContext, stats: SessionStats): string {
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

  if (ctx.training_preferences?.sessions_per_week) {
    lines.push(`Objectif séances/semaine : ${ctx.training_preferences.sessions_per_week}`)
  }

  const injuriesEntries = Object.entries(ctx.injuries)
  if (injuriesEntries.length) lines.push(`Blessures : ${injuriesEntries.map(([k, v]) => `${k}: ${v}`).join(', ')}`)

  const limitationsEntries = Object.entries(ctx.physical_limitations)
  if (limitationsEntries.length) lines.push(`Limitations physiques : ${limitationsEntries.map(([k, v]) => `${k}: ${v}`).join(', ')}`)

  // Stats globales
  lines.push('')
  lines.push('## RÉPARTITION DES ENTRAÎNEMENTS (21 derniers jours)')
  lines.push(`Total séances : ${stats.total_sessions_21d}`)
  lines.push('Par sport :')

  const ALL_SPORTS = ['crossfit', 'running', 'hyrox', 'strength', 'athx']
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

  // Analyses post-workout récentes
  if (ctx.recentAnalyses.length > 0) {
    lines.push('')
    lines.push('## ANALYSES POST-WORKOUT RÉCENTES')
    for (const a of ctx.recentAnalyses.slice(0, 3)) {
      const perfMap: Record<string, string> = {
        pr: 'PR', above_average: 'au-dessus de la moyenne', average: 'dans la moyenne',
        below_average: 'en dessous de la moyenne', first_time: 'première fois',
      }
      lines.push(`- ${a.date} : ${a.workout_name} — ${perfMap[a.performance_level] ?? a.performance_level}`)
      if (a.next_steps) lines.push(`  → Prochaines étapes conseillées : ${a.next_steps}`)
      if (a.improvements.length) lines.push(`  Points à améliorer : ${a.improvements.join(', ')}`)
    }
  }

  // Compétences actives
  if (ctx.activeSkills.length > 0) {
    lines.push('')
    lines.push('## COMPÉTENCES EN COURS')
    for (const skill of ctx.activeSkills) {
      const today = new Date()
      const lastTrained = skill.last_trained
        ? `dernière pratique il y a ${Math.floor((today.getTime() - new Date(skill.last_trained).getTime()) / 86400000)}j`
        : 'jamais pratiquée'
      lines.push(`- ${skill.skill_name} (${skill.skill_category}) — étape actuelle : "${skill.step_title}" — ${lastTrained}`)
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
