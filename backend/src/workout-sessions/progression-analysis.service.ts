import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import OpenAI from 'openai'

export interface TypeTrend {
  type: string
  trend: 'improving' | 'stable' | 'declining'
  detail: string
  session_count: number
}

export interface ProgressionReport {
  period_months: number
  period_summary: string
  overall_trend: 'improving' | 'stable' | 'declining'
  highlights: string[]
  type_trends: TypeTrend[]
  strengths: string[]
  weak_points: string[]
  recommendations: string[]
  consistency_feedback: string
  generated_at: string
}

interface RawSession {
  started_at: string
  completed_at: string | null
  workout_name: string | null
  workout_type: string | null
  results: Record<string, unknown> | null
}

@Injectable()
export class ProgressionAnalysisService {
  private openai: OpenAI

  constructor(@InjectConnection() private readonly knex: Knex) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
    this.openai = new OpenAI({ apiKey })
  }

  async generateReport(userId: string, months = 3): Promise<ProgressionReport> {
    const since = new Date()
    since.setMonth(since.getMonth() - months)

    const [sessions, oneRepMaxes, profile] = await Promise.all([
      this.knex('workout_sessions as ws')
        .leftJoin('workouts as w', 'ws.workout_id', 'w.id')
        .select(
          'ws.started_at',
          'ws.completed_at',
          'ws.results',
          'w.name as workout_name',
          'w.workout_type',
        )
        .where('ws.user_id', userId)
        .whereNotNull('ws.completed_at')
        .where('ws.started_at', '>=', since.toISOString())
        .orderBy('ws.started_at', 'asc') as Promise<RawSession[]>,

      this.knex('one_rep_maxes')
        .select('lift', 'value')
        .where('user_id', userId)
        .orderBy('lift'),

      this.knex('users')
        .select('sport_level', 'global_goals', 'training_preferences')
        .where('id', userId)
        .first(),
    ])

    if (sessions.length < 3) {
      return {
        period_months: months,
        period_summary: `Pas assez de données sur ${months} mois (${sessions.length} séance${sessions.length > 1 ? 's' : ''} complétée${sessions.length > 1 ? 's' : ''}). Reviens après quelques semaines d'entraînement !`,
        overall_trend: 'stable',
        highlights: [],
        type_trends: [],
        strengths: [],
        weak_points: [],
        recommendations: ['Continue à t\'entraîner régulièrement pour débloquer ton bilan IA.'],
        consistency_feedback: 'Données insuffisantes pour l\'instant.',
        generated_at: new Date().toISOString(),
      }
    }

    const aggregated = this.aggregateSessions(sessions)
    const prompt = this.buildPrompt(aggregated, oneRepMaxes, profile, months)

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No response from AI')

    const parsed = JSON.parse(content) as Omit<ProgressionReport, 'period_months' | 'generated_at'>

    return {
      ...parsed,
      period_months: months,
      generated_at: new Date().toISOString(),
    }
  }

  private aggregateSessions(sessions: RawSession[]) {
    const totalSessions = sessions.length

    // Fréquence hebdomadaire
    const firstDate = new Date(sessions[0].started_at)
    const lastDate = new Date(sessions[sessions.length - 1].started_at)
    const weekSpan = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 3600 * 1000)))
    const avgSessionsPerWeek = (totalSessions / weekSpan).toFixed(1)

    // Grouper par type de workout
    const byType: Record<string, { sessions: RawSession[]; firstScore: number | null; lastScore: number | null }> = {}
    for (const s of sessions) {
      const type = s.workout_type ?? 'libre'
      if (!byType[type]) byType[type] = { sessions: [], firstScore: null, lastScore: null }
      byType[type].sessions.push(s)
    }

    const typeStats = Object.entries(byType).map(([type, data]) => {
      const scores = data.sessions
        .map(s => this.extractScore(s.results, type))
        .filter((v): v is number => v !== null)

      let trend: 'improving' | 'stable' | 'declining' = 'stable'
      let pct = 0
      if (scores.length >= 2) {
        const first = scores[0]
        const last = scores[scores.length - 1]
        // Pour for_time : moins = mieux (inverser)
        const isTime = type === 'for_time'
        pct = isTime
          ? ((first - last) / first) * 100
          : ((last - first) / first) * 100
        trend = pct > 5 ? 'improving' : pct < -5 ? 'declining' : 'stable'
      }

      return {
        type,
        count: data.sessions.length,
        improvement_pct: Math.round(pct),
        trend,
        wod_names: [...new Set(data.sessions.map(s => s.workout_name).filter(Boolean))].slice(0, 3),
      }
    })

    // Semaines actives vs total
    const weekSet = new Set(
      sessions.map(s => {
        const d = new Date(s.started_at)
        const dow = d.getDay()
        const monday = new Date(d)
        monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
        return monday.toISOString().split('T')[0]
      })
    )
    const activeWeeks = weekSet.size
    const consistencyPct = Math.round((activeWeeks / weekSpan) * 100)

    return {
      totalSessions,
      avgSessionsPerWeek,
      weekSpan,
      activeWeeks,
      consistencyPct,
      typeStats,
    }
  }

  private extractScore(results: Record<string, unknown> | null, type: string): number | null {
    if (!results) return null
    if (type === 'for_time' && results.elapsed_time_seconds) return results.elapsed_time_seconds as number
    if (type === 'amrap') {
      const rounds = results.rounds as number | undefined
      const reps = results.reps as number | undefined
      if (rounds !== undefined) return rounds * 100 + (reps ?? 0)
    }
    return null
  }

  private buildPrompt(
    agg: ReturnType<ProgressionAnalysisService['aggregateSessions']>,
    oneRepMaxes: { lift: string; value: number }[],
    profile: { sport_level?: string; global_goals?: Record<string, boolean>; training_preferences?: Record<string, unknown> } | undefined,
    months: number,
  ): string {
    const orms = oneRepMaxes.length
      ? oneRepMaxes.map(o => `${o.lift}: ${o.value}kg`).join(', ')
      : 'Non renseignés'

    const goals = profile?.global_goals
      ? Object.entries(profile.global_goals).filter(([, v]) => v).map(([k]) => k).join(', ')
      : 'Non renseignés'

    const typeLines = agg.typeStats
      .map(t => `- ${t.type} (${t.count} séances, trend: ${t.trend}${t.improvement_pct !== 0 ? `, ${t.improvement_pct > 0 ? '+' : ''}${t.improvement_pct}%` : ''})`)
      .join('\n')

    return `Tu es un coach CrossFit expert. Génère un bilan de progression sur les ${months} derniers mois pour cet athlète.

**Profil athlète :**
- Niveau : ${profile?.sport_level ?? 'intermédiaire'}
- Objectifs : ${goals}
- 1RMs actuels : ${orms}

**Données d'entraînement sur ${months} mois :**
- Total séances : ${agg.totalSessions}
- Moyenne/semaine : ${agg.avgSessionsPerWeek}
- Semaines actives : ${agg.activeWeeks} sur ${agg.weekSpan} (${agg.consistencyPct}% de régularité)

**Répartition et tendances par type de WOD :**
${typeLines}

Réponds en JSON avec exactement cette structure :
{
  "period_summary": "Résumé global du bilan en 2-3 phrases, ton coach et motivant",
  "overall_trend": "improving | stable | declining",
  "highlights": ["Point marquant 1", "Point marquant 2"],
  "type_trends": [
    { "type": "for_time", "trend": "improving | stable | declining", "detail": "Explication courte", "session_count": 5 }
  ],
  "strengths": ["Point fort 1", "Point fort 2"],
  "weak_points": ["Axe de progression 1"],
  "recommendations": ["Conseil concret 1", "Conseil concret 2", "Conseil concret 3"],
  "consistency_feedback": "Feedback sur la régularité de l'entraînement"
}`
  }
}
