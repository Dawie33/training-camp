// ============================================================================
// TYPES POUR LES EXERCICES
// ============================================================================

export interface Exercise {
    id: string
    name: string
    category: string
    description?: string
    instructions?: string
    image_url?: string
    video_url?: string
    created_at: string
    updated_at: string
}

export interface CreateExerciseDTO {
    name: string
    category: string
    description?: string
    instructions?: string
    image_url?: string
    video_url?: string
}

export type UpdateExerciseDTO = Partial<CreateExerciseDTO>