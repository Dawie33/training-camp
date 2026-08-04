import { BadRequestException, Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import OpenAI from 'openai'
import { ZodError } from 'zod'
import { UserContextService } from '../../workouts/services/user-context.service'
import { GenerateStrengthSessionDto } from '../dto/strength.dto'
import { buildStrengthSystemPrompt, buildStrengthUserPrompt } from '../prompts/strength-generator.prompt'
import {
  GeneratedStrengthSession,
  GeneratedStrengthSessionSchema,
} from '../schemas/strength-session.schema'

@Injectable()
export class AIStrengthGeneratorService {
  private openai: OpenAI

  constructor(
    @InjectModel() private readonly knex: Knex,
    private readonly userContextService: UserContextService,
  ) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    this.openai = new OpenAI({ apiKey })
  }

  async generateSession(userId: string, dto: GenerateStrengthSessionDto): Promise<GeneratedStrengthSession> {
    const [ctx, recentStrengthSessions] = await Promise.all([
      this.userContextService.getUserAIContext(userId),
      this.knex('strength_sessions')
        .select('target_muscles', 'session_date', 'session_goal', 'perceived_effort', 'duration_minutes')
        .where('user_id', userId)
        .orderBy('session_date', 'desc')
        .limit(5),
    ])

    // Mode coach personnalisé : adapte la séance au profil (1RMs, blessures, historique, équipement) — true par défaut
    const personalized = dto.personalized ?? true

    const userLevel = dto.userLevel ?? (personalized ? ctx.sport_level : undefined) ?? 'intermediate'

    // Équipements : ceux du DTO en priorité, sinon profil utilisateur (uniquement si personnalisé)
    const availableEquipment =
      dto.availableEquipment && dto.availableEquipment.length > 0
        ? dto.availableEquipment
        : personalized ? ctx.equipment_available : []

    // Muscles récemment travaillés pour éviter la surcharge (uniquement si personnalisé)
    const recentMusclesWorked: string[] = []
    if (personalized) {
      for (const s of recentStrengthSessions) {
        const muscles = Array.isArray(s.target_muscles) ? s.target_muscles : []
        recentMusclesWorked.push(...muscles)
      }
    }

    const systemPrompt = buildStrengthSystemPrompt()
    const userPrompt = buildStrengthUserPrompt({
      targetMuscles: dto.targetMuscles,
      sessionGoal: dto.sessionGoal,
      userLevel,
      availableEquipment,
      recentMusclesWorked: [...new Set(recentMusclesWorked)],
      recentStrengthSessions: personalized
        ? recentStrengthSessions.map(s => ({
          session_date: s.session_date,
          session_goal: s.session_goal,
          target_muscles: Array.isArray(s.target_muscles) ? s.target_muscles : [],
          perceived_effort: s.perceived_effort ?? undefined,
          duration_minutes: s.duration_minutes ?? undefined,
        }))
        : [],
      oneRepMaxes: personalized ? ctx.oneRepMaxes : undefined,
      injuries: personalized ? ctx.injuries : undefined,
      physicalLimitations: personalized ? ctx.physical_limitations : undefined,
      additionalContext: dto.additionalContext,
      targetDurationMinutes: dto.targetDurationMinutes,
      bodyFocus: dto.bodyFocus,
      trainingStyle: dto.trainingStyle,
    })

    return this.callOpenAI(systemPrompt, userPrompt)
  }

  /**
   * Extrait et structure une séance de force depuis du texte brut (ex: légende Instagram)
   */
  async parseSessionText(text: string): Promise<GeneratedStrengthSession> {
    const systemPrompt = `Tu es un coach de force certifié spécialisé dans l'extraction et la structuration de séances depuis du texte brut.

Ta mission est d'EXTRAIRE fidèlement la séance décrite dans le texte fourni, sans inventer d'exercices non mentionnés. Pour target_muscles, utilise UNIQUEMENT ces valeurs : chest, back, shoulders, arms, forearms, legs, glutes, core.
${buildStrengthSystemPrompt()}`

    const userPrompt = `Extrait et structure cette séance de force au format JSON :

---
${text}
---

IMPORTANT :
- Extrait fidèlement les informations présentes dans le texte
- Si une information manque (repos, tempo, intensité), utilise une valeur standard raisonnable plutôt que d'inventer un contenu créatif
- N'utilise que l'équipement explicitement mentionné dans le texte
- Structure les exercices en blocks selon les 8 block_type existants (push, pull, hinge, squat, carry, rotation, isolation, core)
- Infère session_goal et target_muscles à partir du contenu si non explicites
- Retourne UNIQUEMENT le JSON structuré, sans texte avant ou après`

    try {
      return await this.callOpenAI(systemPrompt, userPrompt)
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException('Le texte ne semble pas contenir une séance de force valide')
    }
  }

  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<GeneratedStrengthSession> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0]?.message?.content
      if (!content) throw new BadRequestException('Pas de réponse de l\'IA')

      const sessionData = JSON.parse(content)
      return GeneratedStrengthSessionSchema.parse(sessionData)
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('L\'IA a généré un JSON invalide')
      }
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        throw new BadRequestException(`Validation de la séance échouée : ${messages}`)
      }
      throw new BadRequestException(`Impossible de générer la séance : ${(error as Error).message}`)
    }
  }
}
