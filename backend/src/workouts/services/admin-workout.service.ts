// src/workouts/workout-ai.service.ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { OpenAI } from 'openai'
import { buildSystemPromptForSport, exampleSchemaForSport } from '../workouts.prompts'
import { DailyPlanSchema } from '../workouts.schemas'
import { DailyPlan, SportRef, SportSlug, WorkoutBlocks } from '../workouts.types'

@Injectable()
export class AdminWorkoutService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  constructor(
    @InjectModel() private readonly knex: Knex,
  ) {}

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

  /**
   * Récupère l'entraînement de base du jour (draft)
   * @return Liste des entraînements de base du jour
   * @throws Erreur si la récupération échoue
   */
  async getWorkoutOfDay() {
    try {
      const rows = await this.knex('workout_bases')
        .select('*')
        .where((qb) => {
          qb.where('wod_date', '=', this.knex.raw('CURRENT_DATE'))
            .andWhere('status', '=', 'draft');
        })    
      return rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'entraînement de base - ${error}`);
    }
  }

  /**
   * Éditer un workout de base en statut draft/review.
   * Seuls les champs définis sont patchés.
   */
  async updateBaseWorkout(id: string, patch: Partial<{ title: string; tags: string[]; blocks: any; notes: string }>) {
    const data: Record<string, unknown> = {};
    if (patch.title !== undefined)  data.title  = patch.title;
    if (patch.tags  !== undefined)  data.tags   = patch.tags;      
    if (patch.blocks !== undefined) data.blocks = patch.blocks;
    if (patch.notes !== undefined)  data.notes  = patch.notes;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Aucune donnée à mettre à jour');
    }

    data.updated_at = this.knex.fn.now();

    const rows = await this.knex('workouts')
      .where({ id })
      .whereIn('status', ['draft', 'review']) 
      .update(data)
      .returning('*');

    if (!rows.length) {
      throw new NotFoundException("Workout introuvable ou non éditable (déjà publié ?)");
    }

    return rows[0];
  }

  /**
   * Publier un workout de base.
   * - passe le statut à 'published'
   * - pose published_at
   * - (optionnel) empêche les doublons publiés (même date/sport)
   */
  async publishBaseWorkout(id: string) {
    return this.knex.transaction(async (trx) => {
      // On récupère le draft
      const draft = await trx('workouts')
        .where({ id })
        .first();

      if (!draft) throw new NotFoundException('Workout introuvable');
      if (draft.status === 'published') {
        throw new ConflictException('Déjà publié');
      }

      // (Optionnel) empêcher plusieurs "published" pour la même date/sport
      const already = await trx('workouts')
        .where({ date: draft.date, sport_id: draft.sport_id, status: 'published' })
        .andWhereNot({ id })
        .first();

      if (already) {
        throw new ConflictException('Un workout déjà publié existe pour cette date et ce sport');
      }

      const rows = await trx('workouts')
        .where({ id })
        .update(
          {
            status: 'published',
            published_at: trx.fn.now(),
            updated_at: trx.fn.now(),
          },
          '*',
        );

      return rows[0];
    });
  }

}
