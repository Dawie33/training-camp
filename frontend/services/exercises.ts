
// ============================================================================
// Exercices API

import { Exercise } from "@/domain/entities/exercise"
import ResourceApi from "./resourceApi"

// ============================================================================
// Référentiel en lecture seule : aucune création, modification ni suppression via l'API
export const exercisesApi = new ResourceApi<Exercise>('/exercises')

export async function getExercises(params?: {
    limit?: number
    offset?: number
    search?: string
    orderBy?: string
    orderDir?: 'asc' | 'desc'
}) {
    return exercisesApi.getAll(params)
}

export async function getExerciseByName(name: string): Promise<Exercise> {
    // Utiliser l'endpoint spécifique by-name au lieu de l'endpoint par ID
    const apiClient = await import('./apiClient').then(m => m.apiClient)
    return apiClient.get<Exercise>(`/exercises/by-name/${encodeURIComponent(name)}`)
}
