import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import type { WorkoutBlocks } from '../workouts.types'

export class UpdateBaseWorkoutDto {
  @IsOptional()
  @IsString() 
  title?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsObject()
  blocks?: WorkoutBlocks; 

  @IsOptional()
  @IsString()
  notes?: string;
}
