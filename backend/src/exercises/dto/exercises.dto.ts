import { IsArray, IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator'

export class ExercisesDto {
    @IsOptional()
    @IsString()
    id?: string

    @IsString()
    name: string

    @IsString()
    slug: string

    @IsString()
    description: string

    @IsString()
    instructions: string

    @IsString()
    category: string

    @IsArray()
    @IsString({ each: true })
    muscle_groups: string[]

    @IsString()
    difficulty: string

    @IsArray()
    @IsString({ each: true })
    scaling_options: string[]

    @IsString()
    equipment_required: string

    @IsBoolean()
    bodyweight_only: boolean

    @IsString()
    measurement_type: string

    @IsArray()
    @IsString({ each: true })
    contraindications: string[]

    @IsString()
    safety_notes: string

    @IsOptional()
    @IsUrl()
    video_url?: string

    @IsOptional()
    @IsUrl()
    image_url?: string

    @IsBoolean()
    isActive: boolean
}