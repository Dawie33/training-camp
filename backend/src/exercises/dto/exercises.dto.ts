import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export enum ExerciseCategory {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  GYMNASTICS = 'gymnastics',
  OLYMPIC_LIFTING = 'olympic_lifting',
  POWERLIFTING = 'powerlifting',
  ENDURANCE = 'endurance',
  MOBILITY = 'mobility',
}

export enum ExerciseDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum MeasurementType {
  REPS = 'reps',
  TIME = 'time',
  DISTANCE = 'distance',
  WEIGHT = 'weight',
  CALORIES = 'calories',
}

/** Colonnes de tri autorisées : une colonne inconnue ferait échouer la requête SQL (500). */
export const EXERCISE_ORDER_BY = ['name', 'category', 'difficulty', 'created_at', 'updated_at'] as const
/** L'éditeur de workout charge tout le référentiel (limit: 500) ; il compte moins de 100 exercices. */
export const EXERCISES_MAX_LIMIT = 500

export class ExerciseQueryDto {
  // Les paramètres d'URL arrivent en texte : @Type les convertit avant la validation
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(EXERCISES_MAX_LIMIT)
  limit?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string

  @IsOptional()
  @IsEnum(ExerciseCategory)
  category?: ExerciseCategory

  @IsOptional()
  @IsEnum(ExerciseDifficulty)
  difficulty?: ExerciseDifficulty

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  bodyweight_only?: boolean

  @IsOptional()
  @IsIn(EXERCISE_ORDER_BY)
  orderBy?: (typeof EXERCISE_ORDER_BY)[number]

  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDir?: 'asc' | 'desc'
}
