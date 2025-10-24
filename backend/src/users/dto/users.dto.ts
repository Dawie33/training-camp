import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MinLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateUserDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string

  @IsString()
  firstName!: string

  @IsString()
  lastName!: string

  @IsOptional()
  @IsString()
  dateOfBirth?: string

  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  gender?: 'male' | 'female' | 'other'

  @IsOptional()
  @IsIn(['user', 'admin', 'coach'])
  role?: 'user' | 'admin' | 'coach'
}

export class UpdateUserDto {
  @IsOptional()
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
}

export class UserQueryDto {
  @IsOptional()
  @IsString()
  limit?: string

  @IsOptional()
  @IsString()
  offset?: string

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsIn(['user', 'admin', 'coach'])
  role?: 'user' | 'admin' | 'coach'

  @IsOptional()
  @IsString()
  orderBy?: string

  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDir?: 'asc' | 'desc'
}

/**
 * DTO pour les résultats de benchmark
 * Supporte différents types de métriques selon le type de workout
 */
export class BenchmarkResultDto {
  @IsOptional()
  @IsNumber()
  time_seconds?: number // Pour les workouts "For Time" (ex: Fran, Helen)

  @IsOptional()
  @IsNumber()
  rounds?: number // Pour les workouts AMRAP (ex: Cindy)

  @IsOptional()
  @IsNumber()
  reps?: number // Reps complémentaires pour AMRAP

  @IsOptional()
  @IsNumber()
  weight?: number // Poids utilisé si applicable

  @IsOptional()
  @IsString()
  notes?: string // Notes optionnelles
}

/**
 * DTO pour sauvegarder un résultat de benchmark
 */
export class SaveBenchmarkResultDto {
  @IsNotEmpty()
  @IsUUID()
  sportId!: string

  @IsNotEmpty()
  @IsUUID()
  workoutId!: string

  @IsNotEmpty()
  @IsString()
  workoutName!: string

  @ValidateNested()
  @Type(() => BenchmarkResultDto)
  result!: BenchmarkResultDto
}
