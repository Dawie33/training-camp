import { Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { QueryDto } from '../dto/workout.dto'
import { WorkoutBlocks } from '../types/workout.types'


@Injectable()
export class WorkoutService {
  constructor(@InjectModel() private readonly knex: Knex) {}

  /**
   * Retrieves all workouts from the database.
   * @returns An array of all workouts.
   */
  async findAll({ limit = '20', offset = '0', orderBy = 'created_at', orderDir = 'desc' }: QueryDto) {
    try {
      const rows = await this.knex('workouts')
        .select('*')
        .limit(Number(limit))
        .offset(Number(offset))
        .orderBy(orderBy, orderDir);


      const count = await this.knex("users").count({ count: "*" });

      return { rows, count };
    } catch (error) {
      throw new Error('Failed to retrieve workouts: ' + error.message);
    }
  }

  /**
   * Inserts a new daily workout record into the database.
   * @param day { date, sportId, tags, blocks }
   * @param status 
   * @param createdBy 
   * @returns 
   */
  async insertBaseDaily(
    day: { date: string; sportId: string; tags: string[]; blocks: WorkoutBlocks },
  ) {
    const record = {
      wod_date: day.date,
      status: 'draft',
      blocks_json: JSON.stringify(day.blocks),
      tags_json: JSON.stringify(day.tags ?? []),
      sport_id: day.sportId,
      created_by: 'admin',
    };

    const [row] = await this.knex('workout_bases')
      .insert(record)
      .onConflict(['wod_date','sport_id'])
      .merge({
        blocks_json: record.blocks_json,
        tags_json: record.tags_json,
        status: record.status,
        updated_at: this.knex.fn.now(),
      })
      .returning('*');

    return row;
  }


}