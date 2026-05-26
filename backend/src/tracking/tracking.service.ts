import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import OpenAI from 'openai'

export type SportType = 'crossfit' | 'running' | 'hyrox' | 'athx' | 'global'

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
  fitness_profile?: FitnessProfile
  overall_fitness_level?: string
  sport_balance_feedback?: string
  generated_at: string
}

@Injectable()
export class TrackingService {
  private openai: OpenAI

  constructor(@InjectConnection() private readonly knex: Knex) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
    this.openai = new OpenAI({ apiKey })
  }

  async generateReport(userId: string, sport: SportType, months: number): Promise<ProgressionReport> {
    const since = new Date()
    since.setMonth(since.getMonth() - months)

    let report: ProgressionReport
    if (sport === 'global') report = await this.generateGlobalReport(userId, months, since)
    else if (sport === 'crossfit') report = await this.generateCrossfitReport(userId, months, since)
    else if (sport === 'running') report = await this.generateRunningReport(userId, months, since)
    else if (sport === 'hyrox') report = await this.generateHyroxReport(userId, months, since)
    else report = await this.generateAthxReport(userId, months, since)

    await this.saveReport(userId, sport, months, report)
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

  // ─── CrossFit ─────────────────────────────────────────────────────────────

  private async generateCrossfitReport(userId: string, months: number, since: Date): Promise<ProgressionReport> {
    const [sessions, oneRepMaxes, profile] = await Promise.all([
      this.knex('workout_sessions as ws')
        .leftJoin('workouts as w', 'ws.workout_id', 'w.id')
        .select('ws.started_at', 'ws.completed_at', 'ws.results', 'w.name as workout_name', 'w.workout_type')
        .where('ws.user_id', userId)
        .whereNotNull('ws.completed_at')
        .where('ws.started_at', '>=', since.toISOString())
        .orderBy('ws.started_at', 'asc'),
      this.knex('one_rep_maxes').select('lift', 'value').where('user_id', userId).orderBy('lift'),
      this.knex('users').select('sport_level', 'global_goals').where('id', userId).first(),
    ])

    if (sessions.length < 3) return this.notEnoughData('crossfit', months, sessions.length)

    const agg = this.aggregateCrossfit(sessions)
    const prompt = this.buildCrossfitPrompt(agg, oneRepMaxes, profile, months)
    const parsed = await this.callAI(prompt)

    return { sport: 'crossfit', period_months: months, ...parsed, generated_at: new Date().toISOString() }
  }

  private aggregateCrossfit(sessions: any[]) {
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

    const typeStats = Object.entries(byType).map(([type, rows]) => {
      const scores = rows.map(s => this.extractCFScore(s.results, type)).filter((v): v is number => v !== null)
      const { trend, pct } = this.computeTrend(scores, type === 'for_time')
      return { type, count: rows.length, trend, improvement_pct: pct }
    })

    return { total, avgPerWeek, weekSpan, consistencyPct, typeStats }
  }

  private buildCrossfitPrompt(agg: any, orms: any[], profile: any, months: number): string {
    const ormStr = orms.length ? orms.map(o => `${o.lift}: ${o.value}kg`).join(', ') : 'Non renseignés'
    const goals = profile?.global_goals
      ? Object.entries(profile.global_goals).filter(([, v]) => v).map(([k]) => k).join(', ') || 'Non renseignés'
      : 'Non renseignés'
    const typeLines = agg.typeStats
      .map((t: any) => `- ${t.type} (${t.count} séances, ${t.trend}${t.improvement_pct ? `, ${t.improvement_pct > 0 ? '+' : ''}${t.improvement_pct}%` : ''})`)
      .join('\n')

    return `Tu es un coach CrossFit expert. Génère un bilan de progression CrossFit sur ${months} mois.

Niveau : ${profile?.sport_level ?? 'intermédiaire'} | Objectifs : ${goals}
1RMs : ${ormStr}

Données ${months} mois :
- ${agg.total} séances, ${agg.avgPerWeek}/semaine, ${agg.consistencyPct}% régularité

Tendances par type :
${typeLines}

${this.jsonInstructions()}`
  }

  // ─── Running ──────────────────────────────────────────────────────────────

  private async generateRunningReport(userId: string, months: number, since: Date): Promise<ProgressionReport> {
    const sessions = await this.knex('running_sessions')
      .select('session_date', 'run_type', 'distance_km', 'duration_seconds', 'avg_pace_seconds_per_km', 'avg_heart_rate')
      .where('user_id', userId)
      .where('session_date', '>=', since.toISOString().split('T')[0])
      .orderBy('session_date', 'asc')

    if (sessions.length < 3) return this.notEnoughData('running', months, sessions.length)

    const agg = this.aggregateRunning(sessions)
    const prompt = this.buildRunningPrompt(agg, months)
    const parsed = await this.callAI(prompt)

    return { sport: 'running', period_months: months, ...parsed, generated_at: new Date().toISOString() }
  }

  private aggregateRunning(sessions: any[]) {
    const total = sessions.length
    const totalKm = sessions.reduce((acc, s) => acc + (s.distance_km ?? 0), 0).toFixed(1)
    const maxKm = Math.max(...sessions.map(s => s.distance_km ?? 0)).toFixed(1)

    // Tendance allure : comparer première moitié vs deuxième moitié
    const withPace = sessions.filter(s => s.avg_pace_seconds_per_km)
    const mid = Math.floor(withPace.length / 2)
    const firstHalfPace = withPace.slice(0, mid).reduce((a, s) => a + s.avg_pace_seconds_per_km, 0) / (mid || 1)
    const secondHalfPace = withPace.slice(mid).reduce((a, s) => a + s.avg_pace_seconds_per_km, 0) / (withPace.length - mid || 1)
    const paceTrend: 'improving' | 'stable' | 'declining' =
      firstHalfPace - secondHalfPace > 15 ? 'improving' : secondHalfPace - firstHalfPace > 15 ? 'declining' : 'stable'
    const paceImprovePct = firstHalfPace > 0 ? Math.round(((firstHalfPace - secondHalfPace) / firstHalfPace) * 100) : 0

    // FC moyenne
    const withHr = sessions.filter(s => s.avg_heart_rate)
    const avgHr = withHr.length ? Math.round(withHr.reduce((a, s) => a + s.avg_heart_rate, 0) / withHr.length) : null

    // Répartition par type
    const byType: Record<string, number> = {}
    for (const s of sessions) {
      const t = s.run_type ?? 'easy'
      byType[t] = (byType[t] ?? 0) + 1
    }

    const weekSpan = this.computeWeekSpanFromDates(sessions.map(s => s.session_date))
    const consistencyPct = this.computeConsistencyFromDates(sessions.map(s => s.session_date), weekSpan)

    return { total, totalKm, maxKm, paceTrend, paceImprovePct, avgHr, byType, weekSpan, consistencyPct }
  }

  private buildRunningPrompt(agg: any, months: number): string {
    const typeLines = Object.entries(agg.byType)
      .map(([type, count]) => `- ${type}: ${count} séance(s)`)
      .join('\n')

    return `Tu es un coach running expert. Génère un bilan de progression running sur ${months} mois.

Données ${months} mois :
- ${agg.total} séances, ${agg.totalKm} km au total
- Plus longue sortie : ${agg.maxKm} km
- Tendance allure : ${agg.paceTrend}${agg.paceImprovePct ? ` (${agg.paceImprovePct > 0 ? '+' : ''}${agg.paceImprovePct}%)` : ''}
- FC moyenne : ${agg.avgHr ? `${agg.avgHr} bpm` : 'non renseignée'}
- Régularité : ${agg.consistencyPct}% (${agg.weekSpan} semaines)

Types de sorties :
${typeLines}

${this.jsonInstructions()}`
  }

  // ─── HYROX ────────────────────────────────────────────────────────────────

  private async generateHyroxReport(userId: string, months: number, since: Date): Promise<ProgressionReport> {
    const sessions = await this.knex('hyrox_sessions')
      .select('session_date', 'session_type', 'total_time_seconds', 'station_times', 'perceived_effort')
      .where('user_id', userId)
      .where('session_date', '>=', since.toISOString().split('T')[0])
      .orderBy('session_date', 'asc')

    if (sessions.length < 2) return this.notEnoughData('hyrox', months, sessions.length)

    const agg = this.aggregateHyrox(sessions)
    const prompt = this.buildHyroxPrompt(agg, months)
    const parsed = await this.callAI(prompt)

    return { sport: 'hyrox', period_months: months, ...parsed, generated_at: new Date().toISOString() }
  }

  private aggregateHyrox(sessions: any[]) {
    const total = sessions.length
    const simulations = sessions.filter(s => s.session_type === 'full_simulation')

    const simTimes = simulations.map(s => s.total_time_seconds).filter(Boolean)
    const bestTime = simTimes.length ? Math.min(...simTimes) : null
    const simTrend: 'improving' | 'stable' | 'declining' =
      simTimes.length >= 2
        ? (simTimes[0] - simTimes[simTimes.length - 1] > 60 ? 'improving' : simTimes[simTimes.length - 1] - simTimes[0] > 60 ? 'declining' : 'stable')
        : 'stable'

    const byType: Record<string, number> = {}
    for (const s of sessions) { byType[s.session_type] = (byType[s.session_type] ?? 0) + 1 }

    const withEffort = sessions.filter(s => s.perceived_effort)
    const avgEffort = withEffort.length
      ? (withEffort.reduce((a, s) => a + s.perceived_effort, 0) / withEffort.length).toFixed(1)
      : null

    // Station PRs
    const stationPrs: Record<string, number> = {}
    for (const s of sessions) {
      const times: { station: string; time_seconds: number }[] = Array.isArray(s.station_times) ? s.station_times : []
      for (const st of times) {
        if (!stationPrs[st.station] || st.time_seconds < stationPrs[st.station]) {
          stationPrs[st.station] = st.time_seconds
        }
      }
    }

    return { total, simulations: simulations.length, bestTime, simTrend, byType, avgEffort, stationPrs }
  }

  private buildHyroxPrompt(agg: any, months: number): string {
    const typeLines = Object.entries(agg.byType)
      .map(([type, count]) => `- ${type}: ${count} séance(s)`)
      .join('\n')

    const stationLines = Object.entries(agg.stationPrs).length
      ? Object.entries(agg.stationPrs).map(([s, t]) => `- ${s}: ${Math.floor((t as number) / 60)}:${String((t as number) % 60).padStart(2, '0')}`).join('\n')
      : '- Aucun PR de station enregistré'

    const bestTimeStr = agg.bestTime
      ? `${Math.floor(agg.bestTime / 3600)}h${String(Math.floor((agg.bestTime % 3600) / 60)).padStart(2, '0')}`
      : 'aucune simulation complète'

    return `Tu es un coach HYROX expert. Génère un bilan de progression HYROX sur ${months} mois.

Données ${months} mois :
- ${agg.total} séances dont ${agg.simulations} simulation(s) complète(s)
- Meilleur temps simulation : ${bestTimeStr}
- Tendance simulations : ${agg.simTrend}
- Effort perçu moyen : ${agg.avgEffort ?? 'non renseigné'}/10

Types de séances :
${typeLines}

PRs par station :
${stationLines}

${this.jsonInstructions()}`
  }

  // ─── ATHX ─────────────────────────────────────────────────────────────────

  private async generateAthxReport(userId: string, months: number, since: Date): Promise<ProgressionReport> {
    const sessions = await this.knex('athx_sessions')
      .select('session_date', 'session_type', 'duration_minutes', 'perceived_effort', 'zone_results')
      .where('user_id', userId)
      .where('session_date', '>=', since.toISOString().split('T')[0])
      .orderBy('session_date', 'asc')

    if (sessions.length < 2) return this.notEnoughData('athx', months, sessions.length)

    const agg = this.aggregateAthx(sessions)
    const prompt = this.buildAthxPrompt(agg, months)
    const parsed = await this.callAI(prompt)

    return { sport: 'athx', period_months: months, ...parsed, generated_at: new Date().toISOString() }
  }

  private aggregateAthx(sessions: any[]) {
    const total = sessions.length
    const totalMinutes = sessions.reduce((a, s) => a + (s.duration_minutes ?? 0), 0)
    const totalHours = (totalMinutes / 60).toFixed(1)

    const byType: Record<string, number> = {}
    for (const s of sessions) { byType[s.session_type] = (byType[s.session_type] ?? 0) + 1 }

    const withEffort = sessions.filter(s => s.perceived_effort)
    const firstHalfEffort = withEffort.slice(0, Math.floor(withEffort.length / 2))
    const secondHalfEffort = withEffort.slice(Math.floor(withEffort.length / 2))
    const avg = (arr: any[]) => arr.length ? arr.reduce((a, s) => a + s.perceived_effort, 0) / arr.length : 0
    const effortTrend: 'improving' | 'stable' | 'declining' =
      firstHalfEffort.length && secondHalfEffort.length
        ? (avg(firstHalfEffort) - avg(secondHalfEffort) > 0.5 ? 'improving' : avg(secondHalfEffort) - avg(firstHalfEffort) > 0.5 ? 'declining' : 'stable')
        : 'stable'

    return { total, totalHours, byType, effortTrend, avgEffort: withEffort.length ? avg(withEffort).toFixed(1) : null }
  }

  private buildAthxPrompt(agg: any, months: number): string {
    const typeLines = Object.entries(agg.byType)
      .map(([type, count]) => `- ${type}: ${count} séance(s)`)
      .join('\n')

    return `Tu es un coach ATHX expert. Génère un bilan de progression ATHX sur ${months} mois.

Données ${months} mois :
- ${agg.total} séances, ${agg.totalHours}h d'entraînement au total
- Effort perçu moyen : ${agg.avgEffort ?? 'non renseigné'}/10
- Tendance effort : ${agg.effortTrend} (amélioration = effort moindre pour même intensité)

Types de séances :
${typeLines}

${this.jsonInstructions()}`
  }

  // ─── Global ───────────────────────────────────────────────────────────────

  private async generateGlobalReport(userId: string, months: number, since: Date): Promise<ProgressionReport> {
    const sinceDate = since.toISOString().split('T')[0]
    const sinceISO = since.toISOString()

    const [cfSessions, runningSessions, hyroxSessions, athxSessions, orms, profile] = await Promise.all([
      this.knex('workout_sessions').where('user_id', userId).whereNotNull('completed_at').where('started_at', '>=', sinceISO).count('* as count').first(),
      this.knex('running_sessions').where('user_id', userId).where('session_date', '>=', sinceDate)
        .select('distance_km', 'avg_pace_seconds_per_km', 'avg_heart_rate', 'run_type'),
      this.knex('hyrox_sessions').where('user_id', userId).where('session_date', '>=', sinceDate)
        .select('session_type', 'total_time_seconds', 'perceived_effort'),
      this.knex('athx_sessions').where('user_id', userId).where('session_date', '>=', sinceDate)
        .select('duration_minutes', 'perceived_effort', 'session_type'),
      this.knex('one_rep_maxes').select('lift', 'value').where('user_id', userId).orderBy('lift'),
      this.knex('users').select('sport_level', 'global_goals', 'height', 'weight').where('id', userId).first(),
    ])

    const cfCount = Number((cfSessions as any)?.count ?? 0)
    const totalSessions = cfCount + runningSessions.length + hyroxSessions.length + athxSessions.length

    if (totalSessions < 5) return this.notEnoughData('global', months, totalSessions)

    const agg = this.aggregateGlobal({ cfCount, runningSessions, hyroxSessions, athxSessions, orms, profile })
    const prompt = this.buildGlobalPrompt(agg, months)
    const parsed = await this.callAI(prompt, true)

    return { sport: 'global', period_months: months, ...parsed, generated_at: new Date().toISOString() }
  }

  private aggregateGlobal({ cfCount, runningSessions, hyroxSessions, athxSessions, orms, profile }: any) {
    const totalRunningKm = runningSessions.reduce((a: number, s: any) => a + (s.distance_km ?? 0), 0).toFixed(1)
    const paceValues = runningSessions.filter((s: any) => s.avg_pace_seconds_per_km).map((s: any) => s.avg_pace_seconds_per_km)
    const avgPace = paceValues.length ? Math.round(paceValues.reduce((a: number, v: number) => a + v, 0) / paceValues.length) : null

    const hyroxSimulations = hyroxSessions.filter((s: any) => s.session_type === 'full_simulation')
    const bestHyroxTime = hyroxSimulations.length
      ? Math.min(...hyroxSimulations.map((s: any) => s.total_time_seconds).filter(Boolean))
      : null

    const totalAthxHours = (athxSessions.reduce((a: number, s: any) => a + (s.duration_minutes ?? 0), 0) / 60).toFixed(1)

    const ormStr = orms.length ? orms.map((o: any) => `${o.lift}: ${o.value}kg`).join(', ') : 'Non renseignés'

    const balance = {
      crossfit: cfCount,
      running: runningSessions.length,
      hyrox: hyroxSessions.length,
      athx: athxSessions.length,
    }

    return { cfCount, totalRunningKm, avgPace, bestHyroxTime, totalAthxHours, ormStr, balance, profile }
  }

  private buildGlobalPrompt(agg: any, months: number): string {
    const paceStr = agg.avgPace
      ? `${Math.floor(agg.avgPace / 60)}:${String(agg.avgPace % 60).padStart(2, '0')}/km`
      : 'non renseignée'

    const hyroxStr = agg.bestHyroxTime
      ? `${Math.floor(agg.bestHyroxTime / 3600)}h${String(Math.floor((agg.bestHyroxTime % 3600) / 60)).padStart(2, '0')}`
      : 'aucune simulation'

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
- Running : ${agg.totalRunningKm} km totaux, allure moyenne ${paceStr}
- HYROX : ${agg.balance.hyrox} séances, meilleur temps simulation ${hyroxStr}
- ATHX : ${agg.totalAthxHours}h totales

En te basant sur ces données, évalue la condition physique globale de l'athlète.

${this.jsonInstructions(true)}`
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async callAI(prompt: string, isGlobal = false): Promise<Omit<ProgressionReport, 'sport' | 'period_months' | 'generated_at'>> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: isGlobal ? 1500 : 1200,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No response from AI')
    return JSON.parse(content)
  }

  private jsonInstructions(isGlobal = false): string {
    const base = `Réponds en JSON avec exactement cette structure :
{
  "period_summary": "Résumé global en 2-3 phrases, ton coach et motivant",
  "overall_trend": "improving | stable | declining",
  "highlights": ["Point marquant 1", "Point marquant 2"],
  "type_trends": [{ "type": "string", "trend": "improving | stable | declining", "detail": "Explication courte", "session_count": 0 }],
  "strengths": ["Point fort 1", "Point fort 2"],
  "weak_points": ["Axe de progression 1"],
  "recommendations": ["Conseil concret 1", "Conseil concret 2", "Conseil concret 3"],
  "consistency_feedback": "Feedback sur la régularité"`

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

  private extractCFScore(results: any, type: string): number | null {
    if (!results) return null
    if (type === 'for_time' && results.elapsed_time_seconds) return results.elapsed_time_seconds as number
    if (type === 'amrap') {
      const rounds = results.rounds as number | undefined
      const reps = results.reps as number | undefined
      if (rounds !== undefined) return rounds * 100 + (reps ?? 0)
    }
    return null
  }

  private computeTrend(scores: number[], lowerIsBetter: boolean): { trend: 'improving' | 'stable' | 'declining'; pct: number } {
    if (scores.length < 2) return { trend: 'stable', pct: 0 }
    const first = scores[0]
    const last = scores[scores.length - 1]
    const rawPct = lowerIsBetter ? ((first - last) / first) * 100 : ((last - first) / first) * 100
    const pct = Math.round(rawPct)
    return { trend: pct > 5 ? 'improving' : pct < -5 ? 'declining' : 'stable', pct }
  }

  private computeWeekSpan(sessions: { started_at: string }[]): number {
    if (sessions.length < 2) return 1
    const first = new Date(sessions[0].started_at)
    const last = new Date(sessions[sessions.length - 1].started_at)
    return Math.max(1, Math.ceil((last.getTime() - first.getTime()) / (7 * 24 * 3600 * 1000)))
  }

  private computeWeekSpanFromDates(dates: string[]): number {
    if (dates.length < 2) return 1
    const first = new Date(dates[0])
    const last = new Date(dates[dates.length - 1])
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

  private computeConsistencyFromDates(dates: string[], weekSpan: number): number {
    const weekSet = new Set(dates.map(date => {
      const d = new Date(date)
      const dow = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
      return monday.toISOString().split('T')[0]
    }))
    return Math.round((weekSet.size / weekSpan) * 100)
  }
}
