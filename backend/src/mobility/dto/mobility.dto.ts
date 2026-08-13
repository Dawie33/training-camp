import { IsArray, IsEnum, IsIn, IsInt, Max, Min, IsOptional, IsString, ValidateIf } from 'class-validator'

export type MobilityFocusArea = 'hips' | 'shoulders' | 'hips_shoulders' | 'wrists' | 'ankles' | 'thoracic_spine' | 'full_body'
export type MobilityGoal = 'crossfit_technique' | 'relaxation' | 'recovery'
export type MobilityTargetSkill = 'snatch' | 'overhead_squat' | 'clean' | 'jerk' | 'thruster' | 'handstand_hspu'
export type MobilitySourceSport = 'crossfit'

const TARGET_SKILLS = ['snatch', 'overhead_squat', 'clean', 'jerk', 'thruster', 'handstand_hspu']

export class GenerateMobilitySessionDto {
    @IsEnum(['crossfit_technique', 'relaxation', 'recovery'])
    goal!: MobilityGoal

    // Requis sauf pour crossfit_technique (dérivé de target_skill) et le contexte CrossFit auto (dérivé par l'IA, voir source_sport).
    @ValidateIf(o => o.goal !== 'crossfit_technique' && o.source_sport !== 'crossfit')
    @IsEnum(['hips', 'shoulders', 'hips_shoulders', 'wrists', 'ankles', 'thoracic_spine', 'full_body'])
    focus_area?: MobilityFocusArea

    // Requis uniquement pour crossfit_technique : les zones à travailler sont dérivées du mouvement par l'IA.
    @ValidateIf(o => o.goal === 'crossfit_technique')
    @IsEnum(TARGET_SKILLS)
    target_skill?: MobilityTargetSkill

    // Contexte auto-rempli depuis le CTA "étirements de récupération" post-log CrossFit : quand focus_area n'est pas fourni,
    // l'IA déduit elle-même les zones à partir du format/contenu du WOD du jour.
    @IsOptional()
    @IsIn(['crossfit'])
    source_sport?: MobilitySourceSport

    @IsOptional()
    @IsString()
    source_workout_type?: string

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    source_focus_areas_text?: string[]

    // Noms des exercices du WOD (ex: "Thrusters", "Pull-ups") — permet à l'IA de déduire les zones à partir des
    // mouvements réellement effectués, pas seulement du format de la séance.
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    source_exercise_names?: string[]

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
