import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export type MobilityFocusArea = 'hips' | 'shoulders' | 'hips_shoulders' | 'wrists' | 'ankles' | 'thoracic_spine' | 'full_body'
export type MobilityGoal = 'crossfit_technique' | 'relaxation' | 'recovery'

export class GenerateMobilitySessionDto {
    @IsEnum(['hips', 'shoulders', 'hips_shoulders', 'wrists', 'ankles', 'thoracic_spine', 'full_body'])
    focus_area!: MobilityFocusArea

    @IsEnum(['crossfit_technique', 'relaxation', 'recovery'])
    goal!: MobilityGoal

    @IsInt()
    @Min(5)
    @Max(90)
    duration_minutes!: number

    @IsOptional()
    @IsString()
    target_skill?: string

    @IsOptional()
    @IsIn(['beginner', 'intermediate', 'advanced', 'elite'])
    level?: string

    @IsOptional()
    @IsString()
    additional_instructions?: string
}
