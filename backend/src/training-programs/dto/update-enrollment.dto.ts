import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsEnum(['enrolled', 'active', 'paused', 'completed', 'abandoned'])
  status?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  current_week?: number
}

export class SwapSessionDto {
  @IsEnum(['workout', 'ai_regenerate', 'exercise'])
  swap_type!: 'workout' | 'ai_regenerate' | 'exercise'

  // Pour swap_type = 'workout'
  @IsOptional()
  @IsUUID()
  workout_id?: string

  // Pour swap_type = 'ai_regenerate'
  @IsOptional()
  @IsString()
  instructions?: string

  // Pour swap_type = 'exercise'
  @IsOptional()
  @IsString()
  movement_name?: string

  @IsOptional()
  replacement_exercise?: {
    name: string
    sets: number
    reps: string | number
    intensity?: string
    rest?: string
    notes?: string
  }
}

export class SessionAssignmentDto {
  @IsInt()
  @Min(0)
  session_index!: number

  @IsString()
  date!: string // YYYY-MM-DD
}

export class ScheduleWeekDto {
  @IsInt()
  @Min(1)
  week_num!: number

  @IsOptional()
  @IsString()
  start_date?: string // YYYY-MM-DD (fallback auto-distribution)

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  box_dates?: string[] // YYYY-MM-DD[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionAssignmentDto)
  assignments?: SessionAssignmentDto[] // date choisie par séance (index dans la semaine)
}
