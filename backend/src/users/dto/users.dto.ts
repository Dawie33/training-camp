import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

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

/**
 * Champs que l'utilisateur peut modifier sur son propre profil (PATCH /users/me).
 * role, isActive et email sont volontairement absents : avec forbidNonWhitelisted,
 * une requête qui les envoie est rejetée (400). Les bornes suivent le formulaire du front.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName?: string

  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced', 'elite'])
  sport_level?: string

  // Colonnes entières en base : un décimal ferait échouer la requête
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(250)
  height?: number

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(300)
  weight?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(3)
  @Max(60)
  body_fat_percentage?: number

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  equipment_available?: string[]
}
