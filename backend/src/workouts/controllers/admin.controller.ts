import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { UpdateBaseWorkoutDto } from '../dto/update-base-workout.dto'
import { AdminWorkoutService } from '../services/admin-workout.service'
import { WorkoutService } from '../services/workouts.service'

@Controller('admin/workouts')
export class AdminWorkoutController {
constructor(
  private readonly adminService: AdminWorkoutService,
  @InjectModel() private readonly knex: Knex, // <-- injection via décorateur
  private readonly service: WorkoutService
) {}

@Get('day')
async getWorkoutOfDay() {
  return this.adminService.getWorkoutOfDay();
}

@Post('generate-daily')
async generateDaily(@Body() dto: { date: string; sportId: string; tags?: string[]; seed?: any }) {
  // Résoudre le slug via la DB (pseudo-code, adapte à ton KnexService)
  const sport = await this.knex('sports').where({ id: dto.sportId }).first(); // {id, name, slug}
  if (!sport) throw new NotFoundException('Sport not found');

  const plan = await this.adminService.generateDaily(dto.date, { id: sport.id, slug: sport.slug }, dto.seed, dto.tags ?? []);
  const row  = await this.service.insertBaseDaily(plan);
  return { base: row };
}

@Patch(':id')
async updateBase(@Param('id') id: string, @Body() dto: UpdateBaseWorkoutDto) {
  const updated = await this.adminService.updateBaseWorkout(id, dto);
  return { workout: updated };
}

@Post(':id/publish')
async publish(@Param('id') id: string) {
  const published = await this.adminService.publishBaseWorkout(id);
  return { workout: published };
}

}

