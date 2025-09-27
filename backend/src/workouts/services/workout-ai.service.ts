// src/workouts/workout-ai.service.ts
import { Injectable } from '@nestjs/common'
import { OpenAI } from 'openai'
import { buildSystemPromptForSport, exampleSchemaForSport } from '../workouts.prompts'
import { DailyPlanSchema } from '../workouts.schemas'
import { DailyPlan, SportRef, SportSlug, WorkoutBlocks } from '../workouts.types'

@Injectable()
export class WorkoutAiService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  /**
   * Génération journalière par sport.
   * @param date ISO (yyyy-mm-dd)
   * @param sport {id, slug}
   */
  async generateDaily(
    date: string,
    sport: SportRef,
    seed?: Partial<WorkoutBlocks>,
    tags: string[] = [],
  ): Promise<DailyPlan> {
    const system = buildSystemPromptForSport(sport.slug as SportSlug, date, seed?.availableEquipment);
    const schema = exampleSchemaForSport(sport.slug as SportSlug);

    const user = `date: ${date}
    sportId: ${sport.id}
    sportSlug: ${sport.slug}
    tags globaux: ${JSON.stringify(tags)}
    seed: ${JSON.stringify(seed ?? {})}`;

    const res = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 800,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Schéma à respecter: ${schema}` },
        { role: 'user', content: user },
      ],
    });

    const raw = res.choices[0]?.message?.content ?? '{}';
    let day: DailyPlan;

    try {
      day = DailyPlanSchema.parse(JSON.parse(raw));
    } catch (err) {
      throw new Error( `IA: JSON invalide (parse) - ${err} - RAW: ${raw}`);
    }

    if (!day || !day.date || !day.blocks) {
      throw new Error('IA: JSON invalide (séance journalière)');
    }
    return { ...day, sportId: sport.id };
  }
}
