import { IsArray, IsBoolean, IsEmail, IsIn, IsNumber, IsOptional, IsString } from 'class-validator'
import { NormalizeEmail } from 'src/common/decorators/normalize-email.decorator'

export type UserProfile = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'user' | 'admin' | 'coach'
  sport_level: string
  height: number | null
  weight: number | null
  body_fat_percentage: number | null
  equipment_available: string[]
  created_at: string
  updated_at: string
  stats?: {
    workouts: number
    sessions: number
    total_time_minutes?: number
  }
}

export class UpdateUserDto {
  @IsOptional()
  @NormalizeEmail()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsIn(['user', 'admin', 'coach'])
  role?: 'user' | 'admin' | 'coach'

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced', 'elite'])
  sport_level?: string

  @IsOptional()
  @IsNumber()
  height?: number

  @IsOptional()
  @IsNumber()
  weight?: number

  @IsOptional()
  @IsNumber()
  body_fat_percentage?: number

  @IsOptional()
  @IsArray()
  equipment_available?: string[]
}
