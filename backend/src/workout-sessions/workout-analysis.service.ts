import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectConnection } from 'nest-knexjs'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { applyVisibility } from 'src/workouts/services/workout-visibility'
import { WodAnalysis, WodAnalysisSchema } from './schemas/wod-analysis.schema'
import type { SessionResults } from './schemas/session-results.schema'
import { describeEffort, describeRx, describeScore } from './prompts/session-performance'

@Injectable()
export class WorkoutAnalysisService {
  constructor(
    @InjectConnection() private readonly knex: Knex,
    private readonly openaiClientService: OpenAIClientService,
    private readonly userContextService: UserContextService
  ) {}

  async analyzeSession(sessionId: string, userId: string, force = false): Promise<WodAnalysis> {
    // 1. Récupérer la session
    const session = await this.knex('workout_sessions')
      .select('*', this.knex.raw('updated_at::text as analysis_version'))
      .where({ id: sessionId, user_id: userId })
      .first()

    if (!session) throw new NotFoundException('Session not found')

    // Retourner l'analyse déjà stockée en DB si elle existe et qu'on ne force pas la régénération
    if (!force && session.ai_analysis) {
      const stored = typeof session.ai_analysis === 'string' ? JSON.parse(session.ai_analysis) : session.ai_analysis
      return stored as WodAnalysis
    }

    // 2. Récupérer le workout associé
    let workout: Record<string, unknown> | null = null
    if (session.workout_id) {
      workout = await applyVisibility(this.knex('workouts').where({ id: session.workout_id }), { id: userId }).first()
      if (!workout) throw new NotFoundException('Workout non trouvé')
    } else if (session.personalized_workout_id) {
      const personalized = await this.knex('personalized_workouts')
        .where({ id: session.personalized_workout_id, user_id: userId })
        .first()
      if (!personalized) throw new NotFoundException('Workout personnalisé non trouvé')
      workout = typeof personalized.plan_json === 'string' ? JSON.parse(personalized.plan_json) : personalized.plan_json
    }

    // 3. Récupérer les sessions passées pour le même workout (pour comparaison)
    const pastSessions: Record<string, unknown>[] = []
    if (session.workout_id || session.personalized_workout_id) {
      const rows = await this.knex('workout_sessions')
        .where({
          ...(session.workout_id
            ? { workout_id: session.workout_id }
            : { personalized_workout_id: session.personalized_workout_id }),
          user_id: userId,
        })
        .whereNot({ id: sessionId })
        .whereNotNull('completed_at')
        .orderBy('started_at', 'desc')
        .limit(5)
      pastSessions.push(...rows)
    }

    // 4. Construire le prompt
    const results: SessionResults = session.results ?? {}
    const workoutName = (workout?.name as string) ?? 'Workout inconnu'
    const workoutType = (workout?.workout_type as string) ?? 'conditioning'

    const scoreDescription = describeScore(results)
    const pastPerfsDescription = this.buildPastPerfsDescription(pastSessions)
    const workoutDescription = this.buildWorkoutDescription(workout)

    const prompt = `Tu es un coach CrossFit expert. Analyse la performance suivante et donne un retour constructif et motivant.

**Workout : ${workoutName}** (${workoutType})
${workoutDescription}

**Performance actuelle :**
${scoreDescription}
${describeEffort(results)}
${session.notes ? `- Notes de l'athlète : "${session.notes}"` : ''}

**Historique des performances sur ce workout :**
${pastPerfsDescription}

Réponds en JSON avec exactement cette structure :
{
  "summary": "Résumé concis de la performance en 1-2 phrases",
  "performance_level": "pr | above_average | average | below_average | first_time",
  "comparison": "Comparaison avec les perfs passées (null si première fois)",
  "strengths": ["Point fort 1", "Point fort 2"],
  "improvements": ["Axe d'amélioration 1", "Axe d'amélioration 2"],
  "next_steps": "Conseil concret pour progresser sur ce workout"
}`

    const analysis = await this.openaiClientService.createJsonCompletion({
      purpose: 'analyse de séance',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxOutputTokens: 800,
      schema: WodAnalysisSchema,
    })

    const updated = await this.knex('workout_sessions')
      .where({ id: sessionId, user_id: userId, updated_at: session.analysis_version })
      .update({ ai_analysis: JSON.stringify(analysis) })
    if (!updated) throw new ConflictException('La séance a changé pendant l’analyse. Relancez l’analyse.')

    this.userContextService.invalidateCache(userId)

    return analysis
  }

  private buildPastPerfsDescription(sessions: Record<string, unknown>[]): string {
    if (sessions.length === 0) return 'Première fois sur ce workout.'

    const lines = sessions.map((s, i) => {
      const r = (s.results as SessionResults) ?? {}
      const date = new Date(s.started_at as string).toLocaleDateString('fr-FR')
      const score = describeScore(r).replace(/\n/g, ', ').replace(/- /g, '')
      const rx = describeRx(r)
      return `${i + 1}. ${date} — ${score} (${rx})`
    })

    return lines.join('\n')
  }

  private buildWorkoutDescription(workout: Record<string, unknown> | null): string {
    if (!workout) return ''
    const blocks = workout.blocks as Record<string, unknown> | null
    if (!blocks) return ''
    const sections = blocks.sections as Array<Record<string, unknown>> | null
    if (!sections?.length) return ''

    const lines: string[] = []
    for (const section of sections) {
      lines.push(`- ${section.title ?? section.type}`)
      const exercises = section.exercises as Array<Record<string, unknown>> | null
      if (exercises?.length) {
        for (const ex of exercises) {
          const reps = ex.reps ? `${ex.reps} ` : ''
          const weight = ex.weight ? ` @ ${ex.weight}` : ''
          lines.push(`  • ${reps}${ex.name}${weight}`)
        }
      }
    }
    return lines.join('\n')
  }
}
