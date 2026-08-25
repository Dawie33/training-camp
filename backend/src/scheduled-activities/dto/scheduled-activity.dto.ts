import { IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateScheduledActivityDto {
  @IsEnum(['running', 'biking', 'strength', 'skill', 'mobility', 'wod', 'conditioning'])
  activity_type!: 'running' | 'biking' | 'strength' | 'skill' | 'mobility' | 'wod' | 'conditioning'

  @IsDateString()
  scheduled_date!: string

  @IsOptional()
  @IsUUID()
  activity_id?: string

  @IsOptional()
  @IsEnum(['home', 'box'])
  location?: 'home' | 'box'

  @IsOptional()
  @IsString()
  notes?: string
}

export class UpdateScheduledActivityDto {
  @IsOptional()
  @IsDateString()
  scheduled_date?: string

  @IsOptional()
  @IsIn(['scheduled', 'completed', 'skipped', 'rescheduled'])
  status?: 'scheduled' | 'completed' | 'skipped' | 'rescheduled'

  @IsOptional()
  @IsUUID()
  activity_id?: string

  @IsOptional()
  @IsEnum(['home', 'box'])
  location?: 'home' | 'box'

  @IsOptional()
  @IsString()
  notes?: string
}

export class UnifiedActivityQueryDto {
  @IsOptional()
  @IsDateString()
  start_date?: string

  @IsOptional()
  @IsDateString()
  end_date?: string

  @IsOptional()
  @IsIn(['scheduled', 'completed', 'skipped', 'rescheduled'])
  status?: string

  @IsOptional()
  @IsEnum(['crossfit', 'running', 'biking', 'strength', 'skill'])
  module?: 'crossfit' | 'running' | 'biking' | 'strength' | 'skill'
}
