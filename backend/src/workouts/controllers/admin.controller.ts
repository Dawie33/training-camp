import { Body, Controller, NotFoundException, Post } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { WorkoutAiService } from '../services/workout-ai.service'
import { WorkoutService } from '../services/workouts.service'

@Controller('admin/workouts')
export class AdminWorkoutController {
  constructor(
    private readonly ai: WorkoutAiService, 
    @InjectModel() private readonly knex: Knex, // <-- injection via décorateur
    private readonly service: WorkoutService
  ) {}

// src/workouts/admin.controller.ts (extrait)
@Post('generate-daily')
  async generateDaily(@Body() dto: { date: string; sportId: string; tags?: string[]; seed?: any }) {
    // Résoudre le slug via la DB (pseudo-code, adapte à ton KnexService)
    const sport = await this.knex('sports').where({ id: dto.sportId }).first(); // {id, name, slug}
    if (!sport) throw new NotFoundException('Sport not found');

    const plan = await this.ai.generateDaily(dto.date, { id: sport.id, slug: sport.slug }, dto.seed, dto.tags ?? []);
    const row  = await this.service.insertBaseDaily(plan, 'draft');
    return { base: row };
  }

}

