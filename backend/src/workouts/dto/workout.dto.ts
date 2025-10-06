import { Type } from "class-transformer"
import { IsArray, IsIn, IsISO8601, IsOptional, IsString, IsUUID } from "class-validator"

export class CreateWorkoutDto {
  name: string
  slug: string
  description?: string
  type: string
  structure: any
  estimated_duration?: number
  intensity: string
  difficulty: string
  scaling_options?: any
  equipment_required?: any
  bodyweight_only?: boolean
  muscle_groups_targeted?: any
  energy_systems?: any
  ai_generated?: boolean
  ai_parameters?: any
  created_by_user_id?: number
  scoring_type?: string
  usage_count?: number
  average_rating?: number
  total_ratings?: number
  isActive?: boolean
  isFeatured?: boolean
  isPublic?: boolean
  is_benchmark?: boolean
  is_hero_wod?: boolean
  coach_notes?: string
  tags?: any
}

export class UpdateWorkoutDto {
  name?: string
  slug?: string
  description?: string
  type?: string
  structure?: any
  estimated_duration?: number
  intensity?: string
  difficulty?: string
  scaling_options?: any
  equipment_required?: any
  bodyweight_only?: boolean
  muscle_groups_targeted?: any
  energy_systems?: any
  ai_generated?: boolean
  ai_parameters?: any
  created_by_user_id?: number
  scoring_type?: string
  usage_count?: number
  average_rating?: number
  total_ratings?: number
  isActive?: boolean
  isFeatured?: boolean
  isPublic?: boolean
  is_benchmark?: boolean
  is_hero_wod?: boolean
  coach_notes?: string
  tags?: any
}

export class GenerateWeeklyWorkoutDto {
  @IsISO8601()
  date!: string

  @IsUUID()
  sportId!: string

  @IsOptional()
  @IsArray()
  tags?: string[]

  @IsOptional()
  seed?: any
}

export class QueryDto {
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

}

export class basesWorkoutDto {
  wod_date: string
  status: string

}