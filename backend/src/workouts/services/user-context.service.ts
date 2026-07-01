import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'

export interface RecentAnalysis {
  date: string
  workout_name: string
  performance_level: 'pr' | 'above_average' | 'average' | 'below_average' | 'first_time'
  strengths: string[]
  improvements: string[]
  next_steps: string
}

export interface ActiveSkillContext {
  program_id: string
  skill_name: string
  skill_category: string
  step_id: string
  step_title: string
  step_description?: string
  recommended_exercises: Array<{ name: string; sets?: number; reps?: string | number; rest?: string; intensity?: string; notes?: string }>
  coaching_tips?: string
  last_trained: string | null // ISO date ou null si jamais travaillé
}

export interface ProgressionReportSummary {
  sport: string
  period_months: number
  overall_trend: 'improving' | 'stable' | 'declining'
  period_summary: string
  strengths: string[]
  weak_points: string[]
  recommendations: string[]
  overall_fitness_level?: string
  generated_at: string
}

export type RecentSessionSport = 'crossfit' | 'running' | 'strength' | 'biking'

export interface RecentSession {
  date: string
  sport: RecentSessionSport
  workout_type?: string
  duration_minutes: number
  perceived_effort?: number
}

export interface UserAIContext {
  sport_level: string
  height?: number
  weight?: number
  oneRepMaxes: { lift: string; value: number }[]
  benchmarkResults: Record<string, { result: Record<string, number | string>; date: string }>
  global_goals: Record<string, boolean>
  injuries: Record<string, unknown>
  physical_limitations: Record<string, unknown>
  equipment_available: string[]
  training_preferences: { preferred_duration?: number; sessions_per_week?: number }
  recentSessions: RecentSession[]
  recentAnalyses: RecentAnalysis[]
  activeSkills: ActiveSkillContext[]
  progressionReports: ProgressionReportSummary[]
}

@Injectable()
export class UserContextService {
  private readonly cache = new Map<string, { data: UserAIContext; expiresAt: number }>()
  private readonly TTL_MS = 30 * 60 * 1000

  constructor(@InjectModel() private readonly knex: Knex) {}

  invalidateCache(userId: string): void {
    this.cache.delete(userId)
  }

  async getUserAIContext(userId: string): Promise<UserAIContext> {
    const cached = this.cache.get(userId)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }
    const [profile, oneRepMaxes, cfSessions, runningSessions, strengthSessions, bikingSessions, recentAnalysesRaw, activeSkillsRaw, progressionReportsRaw] = await Promise.all([
      this.knex('users')
        .select(
          'sport_level',
          'height',
          'weight',
          'body_fat_percentage',
          'benchmark_results',
          'injuries',
          'physical_limitations',
          'global_goals',
          'equipment_available',
          'training_preferences',
        )
        .where('id', userId)
        .first(),

      this.knex('one_rep_maxes').select('lift', 'value').where('user_id', userId).orderBy('lift'),

      this.knex('workout_sessions as ws')
        .leftJoin('workouts as w', 'ws.workout_id', 'w.id')
        .leftJoin('personalized_workouts as pw', 'ws.personalized_workout_id', 'pw.id')
        .select(
          'ws.started_at',
          'ws.completed_at',
          this.knex.raw("ws.results->>'perceived_effort' as perceived_effort"),
          this.knex.raw("COALESCE(w.workout_type, pw.plan_json->>'workout_type') as workout_type"),
        )
        .where('ws.user_id', userId)
        .whereNotNull('ws.completed_at')
        .whereRaw("ws.started_at >= NOW() - INTERVAL '21 days'")
        .orderBy('ws.started_at', 'desc')
        .limit(10),

      this.knex('running_sessions')
        .select('session_date', 'run_type', 'duration_seconds', 'perceived_effort')
        .where('user_id', userId)
        .whereRaw("session_date >= NOW() - INTERVAL '21 days'")
        .orderBy('session_date', 'desc')
        .limit(7),

      this.knex('strength_sessions')
        .select('session_date', 'session_goal', 'duration_minutes', 'perceived_effort')
        .where('user_id', userId)
        .whereRaw("session_date >= NOW() - INTERVAL '21 days'")
        .orderBy('session_date', 'desc')
        .limit(7),

      this.knex('biking_sessions')
        .select('session_date', 'bike_type', 'duration_seconds', 'perceived_effort')
        .where('user_id', userId)
        .whereRaw("session_date >= NOW() - INTERVAL '21 days'")
        .orderBy('session_date', 'desc')
        .limit(7),

      this.knex('workout_sessions as ws')
        .leftJoin('workouts as w', 'ws.workout_id', 'w.id')
        .select('ws.started_at', 'ws.ai_analysis', 'w.name as workout_name')
        .where('ws.user_id', userId)
        .whereNotNull('ws.ai_analysis')
        .orderBy('ws.started_at', 'desc')
        .limit(5),

      this.knex('skill_programs as sp')
        .join('skill_program_steps as sps', function () {
          this.on('sps.program_id', '=', 'sp.id').andOnVal('sps.status', 'in_progress')
        })
        .leftJoin('skill_progress_logs as spl', 'spl.step_id', 'sps.id')
        .where('sp.user_id', userId)
        .where('sp.status', 'active')
        .select(
          'sp.id as program_id',
          'sp.skill_name',
          'sp.skill_category',
          'sps.id as step_id',
          'sps.title as step_title',
          'sps.description as step_description',
          'sps.recommended_exercises',
          'sps.coaching_tips',
          this.knex.raw('MAX(spl.session_date) as last_trained'),
        )
        .groupBy('sp.id', 'sp.skill_name', 'sp.skill_category', 'sps.id', 'sps.title', 'sps.description', 'sps.recommended_exercises', 'sps.coaching_tips'),

      this.knex('tracking_reports')
        .where('user_id', userId)
        .select('sport', 'period_months', 'report', 'generated_at')
        .orderBy('generated_at', 'desc'),
    ])

    const cfMapped: RecentSession[] = (cfSessions ?? []).map((s: { started_at: string; completed_at: string; workout_type?: string; perceived_effort?: string }) => {
      const start = new Date(s.started_at)
      const end = new Date(s.completed_at)
      return {
        date: start.toISOString().split('T')[0],
        sport: 'crossfit' as const,
        workout_type: s.workout_type ?? undefined,
        duration_minutes: Math.round((end.getTime() - start.getTime()) / 60000),
        perceived_effort: s.perceived_effort ? Number(s.perceived_effort) : undefined,
      }
    })

    const runningMapped: RecentSession[] = (runningSessions ?? []).map((s: { session_date: string | Date; run_type: string; duration_seconds?: number; perceived_effort?: number }) => ({
      date: new Date(s.session_date).toISOString().split('T')[0],
      sport: 'running' as const,
      workout_type: s.run_type,
      duration_minutes: s.duration_seconds ? Math.round(s.duration_seconds / 60) : 0,
      perceived_effort: s.perceived_effort ?? undefined,
    }))

    const strengthMapped: RecentSession[] = (strengthSessions ?? []).map((s: { session_date: string | Date; session_goal: string; duration_minutes?: number; perceived_effort?: number }) => ({
      date: new Date(s.session_date).toISOString().split('T')[0],
      sport: 'strength' as const,
      workout_type: s.session_goal,
      duration_minutes: s.duration_minutes ?? 0,
      perceived_effort: s.perceived_effort ?? undefined,
    }))

    const bikingMapped: RecentSession[] = (bikingSessions ?? []).map((s: { session_date: string | Date; bike_type: string; duration_seconds?: number; perceived_effort?: number }) => ({
      date: new Date(s.session_date).toISOString().split('T')[0],
      sport: 'biking' as const,
      workout_type: s.bike_type,
      duration_minutes: s.duration_seconds ? Math.round(s.duration_seconds / 60) : 0,
      perceived_effort: s.perceived_effort ?? undefined,
    }))

    const recentSessionsMapped = [...cfMapped, ...runningMapped, ...strengthMapped, ...bikingMapped]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20)

    const recentAnalyses: RecentAnalysis[] = (recentAnalysesRaw ?? [])
      .map((row: { started_at: string; ai_analysis: unknown; workout_name?: string }) => {
        const a = typeof row.ai_analysis === 'string' ? JSON.parse(row.ai_analysis) : row.ai_analysis
        if (!a) return null
        return {
          date: new Date(row.started_at).toISOString().split('T')[0],
          workout_name: row.workout_name ?? 'Workout inconnu',
          performance_level: a.performance_level,
          strengths: a.strengths ?? [],
          improvements: a.improvements ?? [],
          next_steps: a.next_steps ?? '',
        }
      })
      .filter(Boolean) as RecentAnalysis[]

    const activeSkills: ActiveSkillContext[] = (activeSkillsRaw ?? []).map(
      (row: {
        program_id: string
        skill_name: string
        skill_category: string
        step_id: string
        step_title: string
        step_description?: string
        recommended_exercises: unknown
        coaching_tips?: string
        last_trained: string | null
      }) => ({
        program_id: row.program_id,
        skill_name: row.skill_name,
        skill_category: row.skill_category,
        step_id: row.step_id,
        step_title: row.step_title,
        step_description: row.step_description ?? undefined,
        recommended_exercises: Array.isArray(row.recommended_exercises)
          ? row.recommended_exercises
          : typeof row.recommended_exercises === 'string'
            ? JSON.parse(row.recommended_exercises)
            : [],
        coaching_tips: row.coaching_tips ?? undefined,
        last_trained: row.last_trained ?? null,
      }),
    )

    const progressionReports: ProgressionReportSummary[] = (progressionReportsRaw ?? []).map(
      (row: { sport: string; period_months: number; report: unknown; generated_at: string }) => {
        const r = typeof row.report === 'string' ? JSON.parse(row.report) : row.report as Record<string, unknown>
        return {
          sport: row.sport,
          period_months: row.period_months,
          overall_trend: r.overall_trend as 'improving' | 'stable' | 'declining',
          period_summary: r.period_summary as string,
          strengths: (r.strengths as string[]) ?? [],
          weak_points: (r.weak_points as string[]) ?? [],
          recommendations: (r.recommendations as string[]) ?? [],
          overall_fitness_level: r.overall_fitness_level as string | undefined,
          generated_at: row.generated_at,
        }
      },
    )

    const result: UserAIContext = {
      sport_level: profile?.sport_level ?? 'intermediate',
      height: profile?.height ?? undefined,
      weight: profile?.weight ?? undefined,
      oneRepMaxes: oneRepMaxes ?? [],
      benchmarkResults: profile?.benchmark_results ?? {},
      global_goals: profile?.global_goals ?? {},
      injuries: profile?.injuries ?? {},
      physical_limitations: profile?.physical_limitations ?? {},
      equipment_available: profile?.equipment_available ?? [],
      training_preferences: profile?.training_preferences ?? {},
      recentSessions: recentSessionsMapped,
      recentAnalyses,
      activeSkills,
      progressionReports,
    }

    this.cache.set(userId, { data: result, expiresAt: Date.now() + this.TTL_MS })
    return result
  }
}
