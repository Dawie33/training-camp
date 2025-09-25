import { Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { CreateWorkoutDto, UpdateWorkoutDto } from './dto'

@Injectable()
export class WorkoutService {
constructor(@InjectModel() private readonly knex: Knex) {}

  async findAll() {
    return await this.knex('workouts').select('*');
  }

  async findOne(id: number) {
    const workout = await this.knex('workouts').where({ id }).first();
    if (!workout) throw new NotFoundException('Workout not found');
    return workout;
  }

  async create(data: CreateWorkoutDto) {
    const [workout] = await this.knex('workouts').insert(data).returning('*');
    return workout;
  }

  async update(id: number, data: UpdateWorkoutDto) {
    const [workout] = await this.knex('workouts')
      .where({ id })
      .update(data)
      .returning('*');
    if (!workout) throw new NotFoundException('Workout not found');
    return workout;
  }

  async remove(id: number) {
    const deleted = await this.knex('workouts').where({ id }).del();
    if (!deleted) throw new NotFoundException('Workout not found');
    return { deleted: true };
  }
}