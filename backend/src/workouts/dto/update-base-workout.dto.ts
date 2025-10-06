import { IsArray, IsObject, IsOptional, IsString } from 'class-validator'
import type { WorkoutBlocks } from '../types/workout.types'

export class UpdateBaseWorkoutDto {
  @IsOptional()
  @IsString()
  wod_date?: string

  @IsOptional()
  @IsArray()
  tags?: string[]

  @IsOptional()
  @IsObject()
  blocks?: WorkoutBlocks

}
