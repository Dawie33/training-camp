// ============================================================================
// TYPES POUR LES EXERCICES
// ============================================================================

export type ExerciseCategory =
    | 'strength'
    | 'cardio'
    | 'gymnastics'
    | 'olympic_lifting'
    | 'powerlifting'
    | 'endurance'
    | 'mobility'

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced'

export type MeasurementType = 'reps' | 'time' | 'distance' | 'weight' | 'calories'

export interface Exercise {
    id: string
    name: string
    category: ExerciseCategory
    description?: string
    instructions?: string
    difficulty?: ExerciseDifficulty
    measurement_type?: MeasurementType
    bodyweight_only?: boolean
    isActive?: boolean
    image_url?: string
    video_url?: string
    created_at: string
    updated_at: string
}

export interface CreateExerciseDTO {
    name: string
    category: ExerciseCategory
    description?: string
    instructions?: string
    difficulty?: ExerciseDifficulty
    measurement_type?: MeasurementType
    bodyweight_only?: boolean
    isActive?: boolean
    image_url?: string
    video_url?: string
}

export type UpdateExerciseDTO = Partial<CreateExerciseDTO>