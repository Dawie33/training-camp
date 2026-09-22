import { Injectable } from '@nestjs/common'
import { buildDiagnosticPromptLines } from 'src/common/ai/diagnostic-prompt'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { PerformanceDiagnosticSummary, UserContextService } from 'src/workouts/services/user-context.service'

export type SportType = 'crossfit' | 'global'

export interface TypeTrend {
  type: string
  trend: 'improving' | 'stable' | 'declining'
  detail: string
  session_count: number
}

export interface FitnessProfile {
  cardio: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  strength: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  work_capacity: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  endurance: 'beginner' | 'intermediate' | 'advanced' | 'elite'
}

export interface ProgressionReport {
  sport: SportType
  period_months: number
  period_summary: string
  overall_trend: 'improving' | 'stable' | 'declining'
  highlights: string[]
  type_trends: TypeTrend[]
  strengths: string[]
  weak_points: string[]
  recommendations: string[]
  consistency_feedback: string
  performance_highlights?: string[]
  strength_progression?: string
  movement_focus?: string[]
  fitness_profile?: FitnessProfile
  overall_fitness_level?: string
  sport_balance_feedback?: string
  generated_at: string
}

@Injectable()
export class TrackingService {
  constructor(
    @InjectConnection() private readonly knex: Knex,
    private readonly openaiClientService: OpenAIClientService,
    private readonly userContextService: UserContextService
  ) {}

  async generateReport(userId: string, sport: SportType, months: number): Promise<ProgressionReport> {
    const since = new Date()
    since.setMonth(since.getMonth() - months)

    let report: ProgressionReport
    if (sport === 'global') report = await this.generateGlobalReport(userId, months, since)
    else report = await this.generateCrossfitReport(userId, months, since)

    await this.saveReport(userId, sport, months, report)
    this.userContextService.invalidateCache(userId)
    return report
  }

  private async saveReport(userId: string, sport: SportType, months: number, report: ProgressionReport): Promise<void> {
    await this.knex('tracking_reports')
      .insert({
        user_id: userId,
        sport,
        period_months: months,
        report: JSON.stringify(report),
        generated_at: new Date().toISOString(),
      })
      .onConflict(['user_id', 'sport'])
      .merge(['period_months', 'report', 'generated_at'])
  }

  async getLatestReports(userId: string): Promise<ProgressionReport[]> {
    const rows = await this.knex('tracking_reports')
      .where('user_id', userId)
      .select('sport', 'period_months', 'report', 'generated_at')
      .orderBy('generated_at', 'desc')

    return rows.map((row: any) => {
      const report = typeof row.report === 'string' ? JSON.parse(row.report) : row.report
      return report as ProgressionReport
    })
  }

  async getSavedReport(userId: string, sport: SportType): Promise<ProgressionReport | null> {
    const row = await this.knex('tracking_reports')
      .where('user_id', userId)
      .where('sport', sport)
      .select('report')
      .first()

    if (!row) return null
    return (typeof row.report === 'string' ? JSON.parse(row.report) : row.report) as ProgressionReport
  }

  /**
   * Régénère le bilan d'un sport s'il n'a pas encore été généré ce mois-ci.
   * Appelé silencieusement à la connexion (voir AuthContext frontend) pour éviter
   * de dépendre d'un cron serveur (backend Render pas toujours up en continu).
   */
  async checkAndGenerateMonthlyReport(userId: string, sport: SportType): Promise<{ generated: boolean }> {
    const existing = await this.knex('tracking_reports').where({ user_id: userId, sport }).first()
    const now = new Date()
    const sameMonth = existing &&
      new Date(existing.generated_at).getMonth() === now.getMonth() &&
      new Date(existing.generated_at).getFullYear() === now.getFullYear()

    if (sameMonth) return { generated: false }

    await this.generateReport(userId, sport, 1)
    return { generated: true }
  }

  // ─── CrossFit ─────────────────────────────────────────────────────────────

  private async generateCrossfitReport(userId: string, months: number, since: Date): Promise<ProgressionReport> {
    const [sessions, oneRepMaxes, ormHistory, benchmarkHistory, profile] = await Promise.all([
      this.knex('workout_sessions as ws')
        .leftJoin('workouts as w', 'ws.workout_id', 'w.id')
        .select('ws.started_at', 'ws.completed_at', 'ws.results', 'w.name as workout_name', 'w.workout_type')
        .where('ws.user_id', userId)
        .whereNotNull('ws.completed_at')
        .where('ws.started_at', '>=', since.toISOString())
        .orderBy('ws.started_at', 'asc'),
      this.knex('one_rep_maxes').select('lift', 'value').where('user_id', userId).orderBy('lift'),
      this.knex('one_rep_max_history')
        .select('lift', 'value', 'measured_at')
        .where('user_id', userId)
        .where('measured_at', '>=', since.toISOString())
        .orderBy('measured_at', 'asc'),
      this.knex('benchmark_history')
        .select('workout_name', 'score_type', 'score_value', 'calculated_level', 'measured_at')
        .where('user_id', userId)
        .where('measured_at', '>=', since.toISOString())
        .orderBy('measured_at', 'asc'),
      this.knex('users').select('sport_level', 'global_goals').where('id', userId).first(),
    ])

    if (sessions.length < 3) return this.notEnoughData('crossfit', months, sessions.length)

    const agg = this.aggregateCrossfit(sessions, ormHistory, benchmarkHistory)
    const { diagnostic } = await this.userContextService.getUserAIContext(userId)
    const prompt = this.buildCrossfitPrompt(agg, oneRepMaxes, profile, months, diagnostic)
    const parsed = await this.callAI(prompt)

    return { sport: 'crossfit', period_months: months, ...parsed, generated_at: new Date().toISOString() }
  }

  private aggregateCrossfit(sessions: any[], ormHistory: any[], benchmarkHistory: any[]) {
    const total = sessions.length
    const weekSpan = this.computeWeekSpan(sessions)
    const avgPerWeek = (total / weekSpan).toFixed(1)
    const consistencyPct = this.computeConsistency(sessions, weekSpan)

    const byType: Record<string, any[]> = {}
    for (const s of sessions) {
      const type = s.workout_type ?? 'libre'
      if (!byType[type]) byType[type] = []
      byType[type].push(s)
    }

    // Volume d'exposition par format, sans tendance : deux WODs d'un même format (Fran et
    // Murph sont tous deux « for time ») ne sont pas comparables entre eux. La progression
    // réelle se lit sur `benchmarkProgression`, où chaque workout est comparé à lui-même.
    const typeStats = Object.entries(byType).map(([type, rows]) => ({ type, count: rows.length }))

    const namedWorkouts = sessions
      .filter(s => s.workout_name)
      .map(s => {
        const result = this.formatCFResult(s.results, s.workout_type)
        return result
          ? { name: s.workout_name, date: s.started_at.toString().split('T')[0], type: s.workout_type, result }
          : null
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .slice(-20)

    const ormByLift: Record<string, { value: number; date: string }[]> = {}
    for (const h of ormHistory) {
      if (!ormByLift[h.lift]) ormByLift[h.lift] = []
      ormByLift[h.lift].push({ value: Number(h.value), date: h.measured_at })
    }
    const ormProgression = Object.entries(ormByLift)
      .filter(([, entries]) => entries.length >= 2)
      .map(([lift, entries]) => ({
        lift,
        start: entries[0].value,
        end: entries[entries.length - 1].value,
        gain: entries[entries.length - 1].value - entries[0].value,
      }))

    const benchByWorkout: Record<string, { score_type: string; score_value: number; calculated_level: string }[]> = {}
    for (const b of benchmarkHistory) {
      if (!benchByWorkout[b.workout_name]) benchByWorkout[b.workout_name] = []
      benchByWorkout[b.workout_name].push({
        score_type: b.score_type,
        score_value: Number(b.score_value),
        calculated_level: b.calculated_level,
      })
    }
    const benchmarkProgression = Object.entries(benchByWorkout).map(([name, entries]) => ({
      name,
      count: entries.length,
      firstLevel: entries[0].calculated_level,
      lastLevel: entries[entries.length - 1].calculated_level,
      lastScore: this.formatScoreValue(entries[entries.length - 1].score_type, entries[entries.length - 1].score_value),
    }))

    return { total, avgPerWeek, weekSpan, consistencyPct, typeStats, namedWorkouts, ormProgression, benchmarkProgression }
  }

  private formatScoreValue(scoreType: string, value: number): string {
    if (scoreType === 'time_seconds') return `${Math.floor(value / 60)}:${String(Math.round(value % 60)).padStart(2, '0')}`
    if (scoreType === 'rounds') return `${value} rounds`
    if (scoreType === 'weight') return `${value}kg`
    return String(value)
  }

  private buildCrossfitPrompt(
    agg: any,
    orms: any[],
    profile: any,
    months: number,
    diagnostic?: PerformanceDiagnosticSummary,
  ): string {
    const ormStr = orms.length ? orms.map(o => `${o.lift}: ${o.value}kg`).join(', ') : 'Non renseignés'
    const goals = profile?.global_goals
      ? Object.entries(profile.global_goals).filter(([, v]) => v).map(([k]) => k).join(', ') || 'Non renseignés'
      : 'Non renseignés'
    const typeLines = agg.typeStats
      .map((t: any) => `- ${t.type} : ${t.count} séance${t.count > 1 ? 's' : ''}`)
      .join('\n')

    const namedLines = agg.namedWorkouts.length
      ? agg.namedWorkouts.map((w: any) => `- ${w.date} | ${w.name} (${w.type}) : ${w.result}`).join('\n')
      : '- Aucun workout nommé avec résultat enregistré'

    const ormProgressionLines = agg.ormProgression.length
      ? agg.ormProgression.map((o: any) => `- ${o.lift}: ${o.start}kg → ${o.end}kg (${o.gain > 0 ? '+' : ''}${o.gain}kg)`).join('\n')
      : '- Aucun nouveau PR de force enregistré sur la période'

    const benchmarkProgressionLines = agg.benchmarkProgression.length
      ? agg.benchmarkProgression
        .map((b: any) => `- ${b.name} : ${b.firstLevel} → ${b.lastLevel} (${b.count} test${b.count > 1 ? 's' : ''}, dernier score : ${b.lastScore})`)
        .join('\n')
      : '- Aucun benchmark testé sur la période'

    return `Tu es un coach CrossFit expert et analytique. Génère un bilan de progression CrossFit approfondi sur ${months} mois.

Profil athlète :
- Niveau : ${profile?.sport_level ?? 'intermédiaire'}
- Objectifs : ${goals}
- 1RMs actuels : ${ormStr}

Volume et régularité :
- ${agg.total} séances sur ${agg.weekSpan} semaines (${agg.avgPerWeek}/semaine)
- Régularité : ${agg.consistencyPct}%

Volume d'exposition par format de WOD (nombre de séances, sans notion de progression) :
${typeLines}

Résultats des workouts nommés (benchmarks, WODs box) :
${namedLines}

Progression des charges / 1RMs sur la période :
${ormProgressionLines}

Progression sur les benchmarks testés (niveau calculé automatiquement) :
${benchmarkProgressionLines}

${buildDiagnosticPromptLines(diagnostic).join('\n')}

Analyse ces données précisément. Cite des résultats concrets (noms de workouts, temps, charges) dans tes commentaires. Sois un vrai coach — pas de conseils génériques.
Le diagnostic calculé fait foi : reprends ses chiffres tels quels et ne propose jamais une lecture qui le contredit.

${this.jsonInstructions()}`
  }

  // ─── Global ───────────────────────────────────────────────────────────────

  private async generateGlobalReport(userId: string, months: number, since: Date): Promise<ProgressionReport> {
    const sinceISO = since.toISOString()

    const [cfSessions, orms, profile] = await Promise.all([
      this.knex('workout_sessions').where('user_id', userId).whereNotNull('completed_at').where('started_at', '>=', sinceISO).count('* as count').first(),
      this.knex('one_rep_maxes').select('lift', 'value').where('user_id', userId).orderBy('lift'),
      this.knex('users').select('sport_level', 'global_goals', 'height', 'weight').where('id', userId).first(),
    ])

    const cfCount = Number((cfSessions as any)?.count ?? 0)
    const totalSessions = cfCount

    if (totalSessions < 5) return this.notEnoughData('global', months, totalSessions)

    const agg = this.aggregateGlobal({ cfCount, orms, profile })
    const prompt = this.buildGlobalPrompt(agg, months)
    const parsed = await this.callAI(prompt, true)

    return { sport: 'global', period_months: months, ...parsed, generated_at: new Date().toISOString() }
  }

  private aggregateGlobal({ cfCount, orms, profile }: any) {
    const ormStr = orms.length ? orms.map((o: any) => `${o.lift}: ${o.value}kg`).join(', ') : 'Non renseignés'

    const balance = {
      crossfit: cfCount,
    }

    return { cfCount, ormStr, balance, profile }
  }

  private buildGlobalPrompt(agg: any, months: number): string {
    const balanceLines = Object.entries(agg.balance)
      .map(([sport, count]) => `- ${sport}: ${count} séance(s)`)
      .join('\n')

    return `Tu es un coach multi-sport expert. Génère un bilan global de condition physique sur ${months} mois.

Profil athlète :
- Niveau déclaré : ${agg.profile?.sport_level ?? 'intermédiaire'}
- 1RMs (force) : ${agg.ormStr}

Volume d'entraînement sur ${months} mois :
${balanceLines}

Indicateurs par discipline :
- CrossFit : ${agg.cfCount} séances

En te basant sur ces données, évalue la condition physique globale de l'athlète.

${this.jsonInstructions(true)}`
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async callAI(prompt: string, isGlobal = false): Promise<Omit<ProgressionReport, 'sport' | 'period_months' | 'generated_at'>> {
    const completion = await this.openaiClientService.client.chat.completions.create({
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: isGlobal ? 2000 : 2500,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No response from AI')
    return JSON.parse(content)
  }

  private jsonInstructions(isGlobal = false): string {
    const base = `Réponds en JSON avec exactement cette structure :
{
  "period_summary": "Résumé global en 3-4 phrases, ton coach précis et motivant. Mentionne des chiffres réels si disponibles.",
  "overall_trend": "improving | stable | declining",
  "highlights": ["Point marquant 1 avec chiffre concret si possible", "Point marquant 2", "Point marquant 3"],
  "type_trends": [{ "type": "string", "trend": "improving | stable | declining", "detail": "Explication précise avec données si disponibles", "session_count": 0 }],
  "strengths": ["Point fort 1 précis", "Point fort 2 précis", "Point fort 3"],
  "weak_points": ["Axe de progression 1 avec explication", "Axe de progression 2"],
  "recommendations": ["Conseil concret et actionnable 1", "Conseil concret 2", "Conseil concret 3", "Conseil concret 4"],
  "consistency_feedback": "Feedback détaillé sur la régularité et le volume",
  "performance_highlights": ["Perf notable 1 avec résultat chiffré", "Perf notable 2"],
  "strength_progression": "Analyse de l'évolution des charges et 1RMs sur la période (ou absence de données)",
  "movement_focus": ["Mouvement/compétence prioritaire à travailler 1", "Mouvement 2"]`

    if (!isGlobal) return base + '\n}'

    return base + `,
  "fitness_profile": {
    "cardio": "beginner | intermediate | advanced | elite",
    "strength": "beginner | intermediate | advanced | elite",
    "work_capacity": "beginner | intermediate | advanced | elite",
    "endurance": "beginner | intermediate | advanced | elite"
  },
  "overall_fitness_level": "Niveau global en une phrase (ex: Athlète intermédiaire polyvalent)",
  "sport_balance_feedback": "Commentaire sur l'équilibre entre les disciplines"
}`
  }

  private notEnoughData(sport: SportType, months: number, count: number): ProgressionReport {
    const noun = count <= 1 ? 'séance complétée' : 'séances complétées'
    return {
      sport,
      period_months: months,
      period_summary: `Pas assez de données sur ${months} mois (${count} ${noun}). Continue à t'entraîner pour débloquer ton bilan !`,
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

  private formatCFResult(results: any, type: string): string | null {
    if (!results) return null
    if (type === 'for_time' && results.elapsed_time_seconds) {
      const s = results.elapsed_time_seconds as number
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
    }
    if (type === 'amrap') {
      const rounds = results.rounds as number | undefined
      const reps = results.reps as number | undefined
      if (rounds !== undefined) return `${rounds} rounds${reps ? ` + ${reps} reps` : ''}`
    }
    if (results.load_kg) return `${results.load_kg}kg`
    if (results.reps) return `${results.reps} reps`
    return null
  }

  private computeWeekSpan(sessions: { started_at: string }[]): number {
    if (sessions.length < 2) return 1
    const first = new Date(sessions[0].started_at)
    const last = new Date(sessions[sessions.length - 1].started_at)
    return Math.max(1, Math.ceil((last.getTime() - first.getTime()) / (7 * 24 * 3600 * 1000)))
  }

  private computeConsistency(sessions: { started_at: string }[], weekSpan: number): number {
    const weekSet = new Set(sessions.map(s => {
      const d = new Date(s.started_at)
      const dow = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
      return monday.toISOString().split('T')[0]
    }))
    return Math.round((weekSet.size / weekSpan) * 100)
  }
}
