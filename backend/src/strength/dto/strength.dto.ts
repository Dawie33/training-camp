import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, IsNumber } from 'class-validator'
import {
  BODY_FOCUS_VALUES,
  STRENGTH_SESSION_STATUS_VALUES,
  TRAINING_STYLE_VALUES,
  type BodyFocus,
  type MuscleGroup,
  type SessionGoal,
  type StrengthSessionStatus,
  type TrainingStyle,
} from '../types/strength.types'

export class GenerateStrengthSessionDto {
  @IsArray()
  @IsEnum(['chest', 'back', 'shoulders', 'arms', 'forearms', 'legs', 'glutes', 'calves', 'core'], { each: true })
  targetMuscles!: MuscleGroup[]

  @IsEnum(['strength', 'hypertrophy', 'endurance', 'power'])
  sessionGoal!: SessionGoal

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced', 'elite'])
  userLevel?: string

  @IsOptional()
  @IsEnum(BODY_FOCUS_VALUES)
  bodyFocus?: BodyFocus

  @IsOptional()
  @IsEnum(TRAINING_STYLE_VALUES)
  trainingStyle?: TrainingStyle

  // Adapte la séance au profil (1RMs, blessures, historique) — true par défaut
  @IsOptional()
  @IsBoolean()
  personalized?: boolean

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableEquipment?: string[]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalContext?: string

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(20)
  @Max(180)
  targetDurationMinutes?: number

  // Plan déjà généré par /generate/preview, évite un second appel IA
  @IsOptional()
  existingPlan?: Record<string, unknown>

  // Date de planification choisie par l'utilisateur — par défaut aujourd'hui si absente
  @IsOptional()
  @IsDateString()
  sessionDate?: string
}

export class ParseStrengthTextDto {
  @IsString()
  @MinLength(10)
  text!: string
}

export class CreateStrengthSessionDto {
  @IsString()
  session_date!: string

  @IsArray()
  @IsString({ each: true })
  target_muscles!: string[]

  @IsEnum(['strength', 'hypertrophy', 'endurance', 'power'])
  session_goal!: SessionGoal

  @IsOptional()
  @IsEnum(BODY_FOCUS_VALUES)
  body_focus?: BodyFocus

  @IsOptional()
  @IsEnum(TRAINING_STYLE_VALUES)
  training_style?: TrainingStyle

  @IsOptional()
  @IsArray()
  equipment_used?: unknown[]

  @IsOptional()
  ai_plan?: Record<string, unknown>

  @IsOptional()
  sets_logged?: Record<string, unknown>[]

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  perceived_effort?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  duration_minutes?: number

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsEnum(STRENGTH_SESSION_STATUS_VALUES)
  status?: StrengthSessionStatus
}

export class UpdateStrengthSessionDto {
  @IsOptional()
  sets_logged?: Record<string, unknown>[]

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  perceived_effort?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  duration_minutes?: number

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsEnum(STRENGTH_SESSION_STATUS_VALUES)
  status?: StrengthSessionStatus

  @IsOptional()
  @IsDateString()
  session_date?: string
}

export class StrengthSessionQueryDto {
  @IsOptional()
  @IsString()
  limit?: string

  @IsOptional()
  @IsString()
  offset?: string

  @IsOptional()
  @IsString()
  start_date?: string

  @IsOptional()
  @IsString()
  end_date?: string

  @IsOptional()
  @IsEnum(['strength', 'hypertrophy', 'endurance', 'power'])
  session_goal?: SessionGoal

  @IsOptional()
  @IsEnum(BODY_FOCUS_VALUES)
  body_focus?: BodyFocus

  @IsOptional()
  @IsString()
  target_muscle?: string
}
