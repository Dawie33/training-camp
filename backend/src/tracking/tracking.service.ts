import { BadRequestException, Injectable } from '@nestjs/common'
import { buildDiagnosticPromptLines } from 'src/common/ai/diagnostic-prompt'
import { toParisDate, toParisWeekStart } from 'src/common/utils/date-only'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { SessionResults } from 'src/workout-sessions/schemas/session-results.schema'
import { PerformanceDiagnosticSummary, UserContextService } from 'src/workouts/services/user-context.service'
import { ZodError } from 'zod'
import { AIProgressionReport, AIProgressionReportSchema } from './schemas/progression-report.schema'
import {
  BenchmarkHistoryRow,
  CrossfitAggregate,
  CrossfitSessionRow,
  GeneratedReport,
  OneRepMaxHistoryRow,
  OneRepMaxRow,
  ProgressionReport,
  SportType,
  TrackingProfileRow,
  TrackingReportRow,
} from './types/tracking.types'

/** Au-delà, la fenêtre glissante a bougé : le bilan enregistré ne décrit plus la même période. */
const REUSE_MAX_AGE_MS = 24 * 3600 * 1000

/**
 * Seul sport suivi depuis le recentrage CrossFit. La colonne `sport` de `tracking_reports` est
 * conservée (clé unique avec `user_id`) : elle reste écrite, mais n'est plus un paramètre de l'API.
 */
const SPORT: SportType = 'crossfit'

@Injectable()
export class TrackingService {
  constructor(
    @InjectConnection() private readonly knex: Knex,
    private readonly openaiClientService: OpenAIClientService,
    private readonly userContextService: UserContextService
  ) {}

  async generateReport(userId: string, months: number): Promise<GeneratedReport> {
    // Chaque génération est un appel IA payant : inutile de le refaire si rien n'a changé
    const reusable = await this.findReusableReport(userId, months)
    if (reusable) return { ...reusable, reused: true }

    // Heure du début et non de la fin : une séance loggée pendant l'appel IA (jusqu'à 120 s)
    // doit compter comme nouvelle donnée pour le bilan suivant
    const startedAt = new Date()
    const since = new Date(startedAt)
    since.setMonth(since.getMonth() - months)

    const report = await this.generateCrossfitReport(userId, months, since)

    await this.saveReport(userId, months, report, startedAt)
    this.userContextService.invalidateCache(userId)
    return { ...report, reused: false }
  }

  /**
   * Bilan enregistré encore valable : même durée, moins de 24 h, et aucune donnée nouvelle depuis.
   */
  private async findReusableReport(userId: string, months: number): Promise<ProgressionReport | null> {
    const row: Pick<TrackingReportRow, 'period_months' | 'report' | 'generated_at'> | undefined = await this.knex(
      'tracking_reports'
    )
      .where({ user_id: userId, sport: SPORT })
      .select('period_months', 'report', 'generated_at')
      .first()

    if (!row || row.period_months !== months) return null

    const generatedAt = new Date(row.generated_at)
    if (Date.now() - generatedAt.getTime() >= REUSE_MAX_AGE_MS) return null
    if (await this.hasNewDataSince(userId, generatedAt)) return null

    return this.parseReport(row.report)
  }

  /**
   * Compare uniquement des dates posées par le serveur : `completed_at` vient du client et peut
   * être antidaté (séance d'hier loggée aujourd'hui), alors que `updated_at` est posé à la
   * création et à chaque modification. Une séance supprimée n'est pas détectée.
   */
  private async hasNewDataSince(userId: string, since: Date): Promise<boolean> {
    const sinceIso = since.toISOString()
    const [session, oneRepMax, benchmark] = await Promise.all([
      this.knex('workout_sessions')
        .where('user_id', userId)
        .whereNotNull('completed_at')
        .where('updated_at', '>', sinceIso)
        .first('id'),
      this.knex('one_rep_max_history').where('user_id', userId).where('measured_at', '>', sinceIso).first('id'),
      this.knex('benchmark_history').where('user_id', userId).where('measured_at', '>', sinceIso).first('id'),
    ])

    return Boolean(session || oneRepMax || benchmark)
  }

  private async saveReport(
    userId: string,
    months: number,
    report: ProgressionReport,
    generatedAt: Date
  ): Promise<void> {
    await this.knex('tracking_reports')
      .insert({
        user_id: userId,
        sport: SPORT,
        period_months: months,
        report: JSON.stringify(report),
        generated_at: generatedAt.toISOString(),
      })
      .onConflict(['user_id', 'sport'])
      .merge(['period_months', 'report', 'generated_at'])
  }

  async getLatestReports(userId: string): Promise<ProgressionReport[]> {
    const rows: Pick<TrackingReportRow, 'report'>[] = await this.knex('tracking_reports')
      .where('user_id', userId)
      .select('report')
      .orderBy('generated_at', 'desc')

    return rows.map(row => this.parseReport(row.report))
  }

  async getSavedReport(userId: string): Promise<ProgressionReport | null> {
    const row: Pick<TrackingReportRow, 'report'> | undefined = await this.knex('tracking_reports')
      .where('user_id', userId)
      .where('sport', SPORT)
      .select('report')
      .first()

    if (!row) return null
    return this.parseReport(row.report)
  }

  /** Colonne jsonb : pg la décode déjà, mais une valeur insérée en texte peut revenir en string. */
  private parseReport(report: TrackingReportRow['report']): ProgressionReport {
    return typeof report === 'string' ? (JSON.parse(report) as ProgressionReport) : report
  }

  /**
   * Régénère le bilan s'il n'a pas encore été généré ce mois-ci.
   * Appelé silencieusement à la connexion (voir AuthContext frontend) pour éviter
   * de dépendre d'un cron serveur (backend Render pas toujours up en continu).
   */
  async checkAndGenerateMonthlyReport(userId: string): Promise<{ generated: boolean }> {
    const existing: Pick<TrackingReportRow, 'generated_at'> | undefined = await this.knex('tracking_reports')
      .where({ user_id: userId, sport: SPORT })
      .first('generated_at')
    const now = new Date()
    const sameMonth =
      existing &&
      new Date(existing.generated_at).getMonth() === now.getMonth() &&
      new Date(existing.generated_at).getFullYear() === now.getFullYear()

    if (sameMonth) return { generated: false }

    const report = await this.generateReport(userId, 1)
    return { generated: !report.reused }
  }

  // ─── CrossFit ─────────────────────────────────────────────────────────────

  private async generateCrossfitReport(userId: string, months: number, since: Date): Promise<ProgressionReport> {
    const [sessions, oneRepMaxes, ormHistory, benchmarkHistory, profile]: [
      CrossfitSessionRow[],
      OneRepMaxRow[],
      OneRepMaxHistoryRow[],
      BenchmarkHistoryRow[],
      TrackingProfileRow | undefined,
    ] = await Promise.all([
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

    if (sessions.length < 3) return this.notEnoughData(months, sessions.length)

    const agg = this.aggregateCrossfit(sessions, ormHistory, benchmarkHistory)
    const { diagnostic } = await this.userContextService.getUserAIContext(userId)
    const prompt = this.buildCrossfitPrompt(agg, oneRepMaxes, profile, months, diagnostic)
    const parsed = await this.callAI(prompt)

    return { sport: SPORT, period_months: months, ...parsed, generated_at: new Date().toISOString() }
  }

  private aggregateCrossfit(
    sessions: CrossfitSessionRow[],
    ormHistory: OneRepMaxHistoryRow[],
    benchmarkHistory: BenchmarkHistoryRow[]
  ): CrossfitAggregate {
    const total = sessions.length
    const weekSpan = this.computeWeekSpan(sessions)
    const avgPerWeek = (total / weekSpan).toFixed(1)
    const consistencyPct = this.computeConsistency(sessions, weekSpan)

    const countByType: Record<string, number> = {}
    for (const s of sessions) {
      const type = s.workout_type ?? 'libre'
      countByType[type] = (countByType[type] ?? 0) + 1
    }

    // Volume d'exposition par format, sans tendance : deux WODs d'un même format (Fran et
    // Murph sont tous deux « for time ») ne sont pas comparables entre eux. La progression
    // réelle se lit sur `benchmarkProgression`, où chaque workout est comparé à lui-même.
    const typeStats = Object.entries(countByType).map(([type, count]) => ({ type, count }))

    // flatMap plutôt que filter + map : TypeScript garde ainsi `workout_name` non null
    const namedWorkouts = sessions
      .flatMap(s => {
        if (!s.workout_name) return []
        const result = this.formatCFResult(s.results, s.workout_type)
        // started_at est un objet Date (timestamptz) : toString().split('T') donnait '' ou du texte tronqué
        return result ? [{ name: s.workout_name, date: toParisDate(s.started_at), type: s.workout_type, result }] : []
      })
      .slice(-20)

    // Valeurs dans l'ordre chronologique (requête triée par measured_at)
    const ormValuesByLift: Record<string, number[]> = {}
    for (const h of ormHistory) {
      if (!ormValuesByLift[h.lift]) ormValuesByLift[h.lift] = []
      ormValuesByLift[h.lift].push(Number(h.value))
    }
    const ormProgression = Object.entries(ormValuesByLift)
      .filter(([, values]) => values.length >= 2)
      .map(([lift, values]) => ({
        lift,
        start: values[0],
        end: values[values.length - 1],
        gain: values[values.length - 1] - values[0],
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

    return {
      total,
      avgPerWeek,
      weekSpan,
      consistencyPct,
      typeStats,
      namedWorkouts,
      ormProgression,
      benchmarkProgression,
    }
  }

  private formatScoreValue(scoreType: string, value: number): string {
    if (scoreType === 'time_seconds')
      return `${Math.floor(value / 60)}:${String(Math.round(value % 60)).padStart(2, '0')}`
    if (scoreType === 'rounds') return `${value} rounds`
    if (scoreType === 'weight') return `${value}kg`
    return String(value)
  }

  private buildCrossfitPrompt(
    agg: CrossfitAggregate,
    orms: OneRepMaxRow[],
    profile: TrackingProfileRow | undefined,
    months: number,
    diagnostic?: PerformanceDiagnosticSummary
  ): string {
    // Number() : la colonne decimal arrive en "100.00", on veut "100kg"
    const ormStr = orms.length ? orms.map(o => `${o.lift}: ${Number(o.value)}kg`).join(', ') : 'Non renseignés'
    const goals = profile?.global_goals
      ? Object.entries(profile.global_goals)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(', ') || 'Non renseignés'
      : 'Non renseignés'
    const typeLines = agg.typeStats.map(t => `- ${t.type} : ${t.count} séance${t.count > 1 ? 's' : ''}`).join('\n')

    // Sans type, on n'affiche pas « (null) » dans le prompt
    const namedLines = agg.namedWorkouts.length
      ? agg.namedWorkouts.map(w => `- ${w.date} | ${w.name}${w.type ? ` (${w.type})` : ''} : ${w.result}`).join('\n')
      : '- Aucun workout nommé avec résultat enregistré'

    const ormProgressionLines = agg.ormProgression.length
      ? agg.ormProgression
          .map(o => `- ${o.lift}: ${o.start}kg → ${o.end}kg (${o.gain > 0 ? '+' : ''}${o.gain}kg)`)
          .join('\n')
      : '- Aucun nouveau PR de force enregistré sur la période'

    const benchmarkProgressionLines = agg.benchmarkProgression.length
      ? agg.benchmarkProgression
          .map(
            b =>
              `- ${b.name} : ${b.firstLevel} → ${b.lastLevel} (${b.count} test${b.count > 1 ? 's' : ''}, dernier score : ${b.lastScore})`
          )
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

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async callAI(prompt: string): Promise<AIProgressionReport> {
    const completion = await this.openaiClientService.client.chat.completions.create({
      model: this.openaiClientService.model,
      messages: [{ role: 'user', content: prompt }],
      ...this.openaiClientService.temperatureParam(0.7),
      max_completion_tokens: 2500,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new BadRequestException('No response from AI')

    try {
      return AIProgressionReportSchema.parse(JSON.parse(content))
    } catch (error) {
      if (error instanceof SyntaxError) throw new BadRequestException('AI generated invalid JSON')
      if (error instanceof ZodError) {
        throw new BadRequestException(
          `Report validation failed: ${error.errors.map(e => `${e.path.join('.')} ${e.message}`).join(', ')}`
        )
      }
      throw error
    }
  }

  private jsonInstructions(): string {
    return `Réponds en JSON avec exactement cette structure :
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
  "movement_focus": ["Mouvement/compétence prioritaire à travailler 1", "Mouvement 2"],
  "fitness_profile": {
    "cardio": "beginner | intermediate | advanced | elite",
    "strength": "beginner | intermediate | advanced | elite",
    "work_capacity": "beginner | intermediate | advanced | elite",
    "endurance": "beginner | intermediate | advanced | elite"
  },
  "overall_fitness_level": "Niveau en une phrase (ex: Athlète intermédiaire polyvalent)"
}`
  }

  private notEnoughData(months: number, count: number): ProgressionReport {
    const noun = count <= 1 ? 'séance complétée' : 'séances complétées'
    return {
      sport: SPORT,
      period_months: months,
      period_summary: `Pas assez de données sur ${months} mois (${count} ${noun}). Continue à t'entraîner pour débloquer ton bilan !`,
      overall_trend: 'stable',
      highlights: [],
      type_trends: [],
      strengths: [],
      weak_points: [],
      recommendations: ["Continue à t'entraîner régulièrement pour débloquer ton bilan IA."],
      consistency_feedback: "Données insuffisantes pour l'instant.",
      generated_at: new Date().toISOString(),
    }
  }

  private formatCFResult(results: SessionResults | null, type: string | null): string | null {
    if (!results) return null
    if (type === 'for_time' && results.elapsed_time_seconds) {
      const s = results.elapsed_time_seconds
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
    }
    if (type === 'amrap' && results.rounds !== undefined) {
      return `${results.rounds} rounds${results.reps ? ` + ${results.reps} reps` : ''}`
    }
    // `load_kg` à la racine : format historique, absent du schéma (passthrough), donc à vérifier
    if (typeof results.load_kg === 'number' && results.load_kg > 0) return `${results.load_kg}kg`
    if (results.reps) return `${results.reps} reps`
    return null
  }

  private computeWeekSpan(sessions: { started_at: Date }[]): number {
    if (sessions.length < 2) return 1
    const first = new Date(sessions[0].started_at)
    const last = new Date(sessions[sessions.length - 1].started_at)
    return Math.max(1, Math.ceil((last.getTime() - first.getTime()) / (7 * 24 * 3600 * 1000)))
  }

  private computeConsistency(sessions: { started_at: Date }[], weekSpan: number): number {
    // Semaines comptées à Paris : une séance le lundi entre 0 h et 2 h ne bascule plus dans la semaine précédente
    const weekSet = new Set(sessions.map(s => toParisWeekStart(s.started_at)))
    return Math.round((weekSet.size / weekSpan) * 100)
  }
}
