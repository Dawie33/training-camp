import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'

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
  recentSessions: {
    date: string
    workout_type?: string
    duration_minutes: number
    perceived_effort?: number
  }[]
}

@Injectable()
export class UserContextService {
  constructor(@InjectModel() private readonly knex: Knex) {}

  async getUserAIContext(userId: string): Promise<UserAIContext> {
    const [profile, oneRepMaxes, recentSessions] = await Promise.all([
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
        .whereRaw("ws.started_at >= NOW() - INTERVAL '7 days'")
        .orderBy('ws.started_at', 'desc')
        .limit(10),
    ])

    const recentSessionsMapped = recentSessions.map(
      (s: {
        started_at: string
        completed_at: string
        workout_type?: string
        perceived_effort?: string
      }) => {
        const start = new Date(s.started_at)
        const end = new Date(s.completed_at)
        const duration_minutes = Math.round((end.getTime() - start.getTime()) / 60000)
        return {
          date: start.toISOString().split('T')[0],
          workout_type: s.workout_type ?? undefined,
          duration_minutes,
          perceived_effort: s.perceived_effort ? Number(s.perceived_effort) : undefined,
        }
      },
    )

    return {
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
    }
  }
}
