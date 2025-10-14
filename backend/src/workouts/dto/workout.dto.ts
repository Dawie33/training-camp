import { Type } from "class-transformer"
import { IsArray, IsBoolean, IsIn, IsInt, IsISO8601, IsNumber, IsOptional, IsString, IsUUID } from "class-validator"

export class CreateWorkoutDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  slug?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  workout_type?: string

  @IsUUID()
  @IsOptional()
  sport_id?: string

  @IsOptional()
  blocks?: Record<string, unknown>

  @IsInt()
  @IsOptional()
  estimated_duration?: number

  @IsString()
  @IsOptional()
  intensity?: string

  @IsString()
  @IsOptional()
  difficulty?: string

  @IsOptional()
  scaling_options?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  equipment_required?: string[]

  @IsArray()
  @IsOptional()
  focus_areas?: string[]

  @IsArray()
  @IsOptional()
  metrics_tracked?: string[]

  @IsBoolean()
  @IsOptional()
  ai_generated?: boolean

  @IsOptional()
  ai_parameters?: Record<string, unknown>

  @IsUUID()
  @IsOptional()
  created_by_user_id?: string

  @IsOptional()
  target_metrics?: Record<string, unknown>

  @IsInt()
  @IsOptional()
  usage_count?: number

  @IsNumber()
  @IsOptional()
  average_rating?: number

  @IsInt()
  @IsOptional()
  total_ratings?: number

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string

  @IsString()
  @IsOptional()
  scheduled_date?: string

  @IsBoolean()
  @IsOptional()
  is_benchmark?: boolean

  @IsString()
  @IsOptional()
  coach_notes?: string

  @IsArray()
  @IsOptional()
  tags?: string[]
}

export class UpdateWorkoutDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  workout_type?: string

  @IsInt()
  @IsOptional()
  estimated_duration?: string

  @IsString()
  @IsOptional()
  intensity?: string

  @IsString()
  @IsOptional()
  difficulty?: string

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean

  @IsOptional()
  blocks?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  tags?: string[]

  @IsString()
  @IsOptional()
  scheduled_date?: string
}

export class GenerateWorkoutDto {
  @IsISO8601()
  date!: string

  @IsUUID()
  sportId!: string

  @IsOptional()
  @IsArray()
  tags?: string[]

  @IsOptional()
  seed?: Record<string, unknown>
}

export class WorkoutQueryDto {
  @IsOptional()
  @Type(() => String)
  @IsString()
  limit?: string

  @IsOptional()
  @Type(() => String)
  @IsString()
  offset?: string

  @IsOptional()
  @IsString()
  orderBy?: string

  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDir?: 'asc' | 'desc'

  @IsOptional()
  @Type(() => String)
  search?: string

  @IsOptional()
  @Type(() => String)
  @IsIn(['draft', 'published', 'archived'])
  status?: string

  @IsOptional()
  @Type(() => String)
  scheduled_date?: string

  @IsOptional()
  @IsUUID()
  sport_id?: string
}
