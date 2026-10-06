import { IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

export const SCHEDULED_ACTIVITY_NOTES_MAX_LENGTH = 500

export class CreateScheduledActivityDto {
  @IsEnum(['skill', 'wod', 'conditioning'])
  activity_type!: 'skill' | 'wod' | 'conditioning'

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
  @MaxLength(SCHEDULED_ACTIVITY_NOTES_MAX_LENGTH)
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
  @MaxLength(SCHEDULED_ACTIVITY_NOTES_MAX_LENGTH)
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
  @IsEnum(['crossfit', 'skill', 'wod', 'conditioning'])
  module?: 'crossfit' | 'skill' | 'wod' | 'conditioning'
}
