import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator'

export class GenerateStrengthProgramDto {
  @IsIn([4, 6, 8, 12])
  duration_weeks!: number

  @IsIn([1, 2, 3, 4, 5])
  sessions_per_week!: number

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  target_level?: string

  @IsOptional()
  @IsEnum(['force_max', 'hypertrophy', 'powerlifting_peak', 'strongman_prep'])
  training_style?: string

  @IsOptional()
  @IsString()
  focus?: string
}
