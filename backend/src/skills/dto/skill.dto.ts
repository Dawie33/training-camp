import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'

export class GenerateSkillProgramDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  skillName!: string

  @IsEnum(['gymnastics', 'olympic_lifting', 'strength', 'mobility'])
  skillCategory!: 'gymnastics' | 'olympic_lifting' | 'strength' | 'mobility'

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  currentCapabilities?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  constraints?: string

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced', 'elite'])
  userLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elite'

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  availableEquipment?: string[]
}

export class CreateSkillProgramDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  skill_name!: string

  @IsEnum(['gymnastics', 'olympic_lifting', 'strength', 'mobility'])
  skill_category!: 'gymnastics' | 'olympic_lifting' | 'strength' | 'mobility'

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  estimated_weeks?: number

  @IsOptional()
  @IsObject()
  ai_parameters?: Record<string, unknown>

  @IsOptional()
  @IsString()
  progression_notes?: string

  @IsOptional()
  @IsString()
  safety_notes?: string

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreateSkillStepDto)
  steps!: CreateSkillStepDto[]
}

export class CreateSkillStepDto {
  @IsInt()
  @Min(1)
  step_number!: number

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsObject()
  validation_criteria?: Record<string, unknown>

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  recommended_exercises?: Record<string, unknown>[]

  @IsOptional()
  @IsString()
  coaching_tips?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  estimated_duration_weeks?: number

  @IsOptional()
  @IsString()
  frequency?: string | null

  @IsOptional()
  @IsString()
  when_to_train?: string | null

  @IsOptional()
  @IsString()
  warmup?: string | null
}

export class UpdateSkillProgramDto {
  @IsOptional()
  @IsIn(['active', 'completed', 'paused', 'abandoned'])
  status?: string

  @IsOptional()
  @IsString()
  progression_notes?: string
}

export class UpdateSkillStepDto {
  @IsOptional()
  @IsIn(['locked', 'in_progress', 'completed', 'skipped'])
  status?: string

  @IsOptional()
  @IsBoolean()
  manually_overridden?: boolean
}

export class CreateSkillProgressLogDto {
  @IsUUID()
  step_id!: string

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  session_date!: string

  @IsOptional()
  @IsObject()
  performance_data?: Record<string, unknown>

  @IsOptional()
  @IsString()
  session_notes?: string
}
