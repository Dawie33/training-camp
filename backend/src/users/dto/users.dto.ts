import { Type } from 'class-transformer'
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
  ValidateNested,
  ValidateBy,
  ValidateIf,
  isISO8601,
} from 'class-validator'
import type { z } from 'zod'
import {
  GlobalGoalsSchema,
  TrainingPreferencesSchema,
  PhysicalLimitationsSchema,
  SchedulePreferencesSchema,
} from 'src/common/profile/profile.schema'
import type { GlobalGoals, TrainingPreferences, SchedulePreferences } from 'src/common/profile/profile.schema'
import { toParisDate } from 'src/common/utils/date-only'
import { MAX_PLAUSIBLE_MAX_HR, MIN_PLAUSIBLE_MAX_HR } from 'src/common/heart-rate/heart-rate.constants'
import { INJURIES_MAX_COUNT } from 'src/common/injuries/injury.constants'
import type { Injury } from 'src/common/injuries/injury.constants'
import { InjuryDto } from './injury.dto'

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
  dateOfBirth: string | null
  gender: 'male' | 'female' | 'other' | null
  resting_heart_rate: number | null
  max_heart_rate: number | null
  global_goals: GlobalGoals | null
  training_preferences: TrainingPreferences | null
  physical_limitations: string[] | Record<string, unknown> | null
  schedule_preferences: SchedulePreferences | null
  equipment_available: string[]
  injuries: Injury[]
  created_at: string
  updated_at: string
  stats?: {
    workouts: number
    sessions: number
    total_time_minutes?: number
  }
}

function ProfileJson(schema: z.ZodTypeAny) {
  return ValidateBy({
    name: 'profileJson',
    validator: {
      validate: (value: unknown) => schema.safeParse(value).success,
      defaultMessage: args => `${args?.property} : structure ou valeurs invalides`,
    },
  })
}

/**
 * Champs que l'utilisateur peut modifier sur son propre profil (PATCH /users/me).
 * role, isActive et email sont volontairement absents : avec forbidNonWhitelisted,
 * une requête qui les envoie est rejetée (400). Les bornes suivent le formulaire du front.
 */
export class UpdateUserDto {
  @IsOptional()
  @ValidateBy({
    name: 'birthDate',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        isISO8601(value, { strict: true }) &&
        value >= '1900-01-01' &&
        value <= toParisDate(new Date()),
      defaultMessage: () => 'dateOfBirth doit etre une date valide non future (AAAA-MM-JJ, depuis 1900)',
    },
  })
  dateOfBirth?: string | null

  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  gender?: 'male' | 'female' | 'other' | null

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(120)
  resting_heart_rate?: number | null

  @ValidateIf((_object, value) => value !== undefined)
  @ProfileJson(GlobalGoalsSchema)
  global_goals?: GlobalGoals

  @ValidateIf((_object, value) => value !== undefined)
  @ProfileJson(TrainingPreferencesSchema)
  training_preferences?: TrainingPreferences

  @ValidateIf((_object, value) => value !== undefined)
  // Evite la conversion implicite d'un objet JSON en tableau vide avant Zod.
  @Type(() => Object)
  @ProfileJson(PhysicalLimitationsSchema)
  physical_limitations?: string[]

  @ValidateIf((_object, value) => value !== undefined)
  @ProfileJson(SchedulePreferencesSchema)
  schedule_preferences?: SchedulePreferences

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

  // Référence des zones cardiaques des séances importées (fit-import/hr-zones.ts)
  @IsOptional()
  @IsInt()
  @Min(MIN_PLAUSIBLE_MAX_HR)
  @Max(MAX_PLAUSIBLE_MAX_HR)
  max_heart_rate?: number

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  equipment_available?: string[]

  // Liste complète : le front renvoie toutes les blessures à chaque enregistrement
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(INJURIES_MAX_COUNT)
  @ValidateNested({ each: true })
  @Type(() => InjuryDto)
  injuries?: InjuryDto[]
}
