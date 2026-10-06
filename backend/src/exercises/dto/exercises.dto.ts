import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator'
import { Transform } from 'class-transformer'

export enum ExerciseCategory {
    STRENGTH = 'strength',
    CARDIO = 'cardio',
    GYMNASTICS = 'gymnastics',
    OLYMPIC_LIFTING = 'olympic_lifting',
    POWERLIFTING = 'powerlifting',
    ENDURANCE = 'endurance',
    MOBILITY = 'mobility'
}

export enum ExerciseDifficulty {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced'
}

export enum MeasurementType {
    REPS = 'reps',
    TIME = 'time',
    DISTANCE = 'distance',
    WEIGHT = 'weight',
    CALORIES = 'calories'
}

export class ExerciseQueryDto {
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
    @IsString()
    orderBy?: string

    @IsOptional()
    @IsString()
    orderDir?: 'asc' | 'desc'
}
