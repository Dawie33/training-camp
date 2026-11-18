import { Type } from 'class-transformer'
import { IsISO8601, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, Min, ValidateIf } from 'class-validator'
import type { SessionResults } from '../schemas/session-results.schema'

export class UpdateWorkoutSessionDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsISO8601({ strict: true })
  completed_at?: string

  @IsOptional()
  @IsString()
  notes?: string

  @ValidateIf((_object, value) => value !== undefined)
  @IsObject()
  results?: Record<string, unknown>
}

export class CreateWorkoutSessionDto extends UpdateWorkoutSessionDto {
  @IsOptional()
  @IsUUID()
  workout_id?: string

  @IsOptional()
  @IsUUID()
  personalized_workout_id?: string

  @IsOptional()
  @IsUUID()
  schedule_id?: string

  @ValidateIf((_object, value) => value !== undefined)
  @IsISO8601({ strict: true })
  started_at?: string
}

export class ListSessionsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  offset = 0
}

export class WorkoutSession {
  id: string
  workout_id?: string
  personalized_workout_id?: string
  user_id: string
  started_at: string
  completed_at?: string
  notes?: string
  results?: SessionResults
  created_at: string
  updated_at: string
}
