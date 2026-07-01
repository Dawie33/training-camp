import { IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateScheduledActivityDto {
  @IsEnum(['running', 'strength'])
  activity_type!: 'running' | 'strength'

  @IsDateString()
  scheduled_date!: string

  @IsOptional()
  @IsUUID()
  activity_id?: string

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
  @IsEnum(['crossfit', 'running', 'strength'])
  module?: 'crossfit' | 'running' | 'strength'
}
