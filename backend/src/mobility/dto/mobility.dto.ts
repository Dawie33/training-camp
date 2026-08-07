import { IsEnum, IsIn, IsInt, Max, Min, IsOptional, IsString, ValidateIf } from 'class-validator'

export type MobilityFocusArea = 'hips' | 'shoulders' | 'hips_shoulders' | 'wrists' | 'ankles' | 'thoracic_spine' | 'full_body'
export type MobilityGoal = 'crossfit_technique' | 'relaxation' | 'recovery'
export type MobilityTargetSkill = 'snatch' | 'overhead_squat' | 'clean' | 'jerk' | 'thruster' | 'handstand_hspu'

const TARGET_SKILLS = ['snatch', 'overhead_squat', 'clean', 'jerk', 'thruster', 'handstand_hspu']

export class GenerateMobilitySessionDto {
    @IsEnum(['crossfit_technique', 'relaxation', 'recovery'])
    goal!: MobilityGoal

    // Requis uniquement pour relaxation/recovery : sans mouvement technique à préparer, l'utilisateur choisit directement la zone.
    @ValidateIf(o => o.goal !== 'crossfit_technique')
    @IsEnum(['hips', 'shoulders', 'hips_shoulders', 'wrists', 'ankles', 'thoracic_spine', 'full_body'])
    focus_area?: MobilityFocusArea

    // Requis uniquement pour crossfit_technique : les zones à travailler sont dérivées du mouvement par l'IA.
    @ValidateIf(o => o.goal === 'crossfit_technique')
    @IsEnum(TARGET_SKILLS)
    target_skill?: MobilityTargetSkill

    @IsInt()
    @Min(5)
    @Max(90)
    duration_minutes!: number

    @IsOptional()
    @IsIn(['beginner', 'intermediate', 'advanced', 'elite'])
    level?: string

    @IsOptional()
    @IsString()
    additional_instructions?: string
}
