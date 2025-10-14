// ============================================================================
// TYPES POUR LES WORKOUTS
// ============================================================================
export interface AdminWorkoutExercise {
    id: string
    workout_id: string
    exercise_id: string
    exercise_name: string
    category: string
    order_index: number
    sets?: string
    reps?: string
    weight?: string
    distance?: string
    time?: string
    specific_instructions?: string
    is_warmup: boolean
    is_cooldown: boolean
    is_main_workout: boolean
}

export interface AdminWorkout {
    id: string
    name?: string
    slug?: string
    description?: string
    workout_type?: string
    sport_id?: string
    blocks?: Record<string, unknown>
    estimated_duration?: number
    intensity?: string
    difficulty?: string
    status: string
    isActive: boolean
    isFeatured: boolean
    isPublic: boolean
    ai_generated: boolean
    scheduled_date?: string
    tags?: string[]
    created_at: string
    updated_at: string
    exercises?: AdminWorkoutExercise[]
}

export interface CreateWorkoutDTO {
    name?: string
    description?: string
    workout_type?: string
    sport_id?: string
    blocks?: Record<string, unknown>
    estimated_duration?: number
    intensity?: string
    difficulty?: string
    status?: string
    isActive?: boolean
    isFeatured?: boolean
    isPublic?: boolean
    scheduled_date?: string
    tags?: string[]
}

export type UpdateWorkoutDTO = Partial<CreateWorkoutDTO>

export interface WorkoutQueryParams {
    limit?: number
    offset?: number
    search?: string
    status?: string
    sport_id?: string
    [key: string]: string | number | boolean | undefined
}

// Note: L'ancienne structure WorkoutBlocks a été remplacée par la nouvelle structure modulaire
// dans workout-structure.ts. Cette interface Workouts utilise Record<string, unknown> pour
// la compatibilité avec les workouts existants en base de données.
export interface Workouts {
    id: string
    name: string
    slug: string
    description: string
    workout_type: string
    sport_id: string
    blocks: Record<string, unknown>
    estimated_duration?: number
    intensity: string
    difficulty: string
    scaling_options?: string[]
    equipment_required?: string[]
    focus_area?: string
    coach_notes?: string
    metrics_tracked?: string
    scheduled_date: string
    tags: string[]
    status: string
}

export interface WorkoutSessionCreate {
    workout_id: string
    started_at?: string
}

export interface WorkoutSessionUpdate {
    completed_at?: string
    notes?: string
    results?: Record<string, unknown>
}

export interface WorkoutSession {
    id: string
    workout_id: string
    user_id: string
    started_at: string
    completed_at?: string
    notes?: string
    results?: Record<string, unknown>
    created_at: string
    updated_at: string
}