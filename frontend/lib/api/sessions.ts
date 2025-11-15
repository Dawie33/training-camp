import { WorkoutSession, WorkoutSessionCreate, WorkoutSessionUpdate } from '../types/workout'
import { apiClient } from './apiClient'
import { ResourceApi } from './resourceApi'
import type { QueryParams } from './types'


export const SessionApi = new ResourceApi<WorkoutSession>('/workout-sessions')

export class SessionService {

    /**
     * Démarre une nouvelle session de workout
     * @param data Données de la session à créer
     * @returns Promesse contenant la session créée
     */
    async startSession(data: WorkoutSessionCreate): Promise<WorkoutSession> {
        const response = await apiClient.post<WorkoutSession>('/workout-sessions', data)
        return response
    }

    /**
     * Met à jour une session de workout
     * @param sessionId ID de la session
     * @param data Données à mettre à jour
     * @returns Promesse contenant la session mise à jour
     */
    async updateSession(sessionId: string, data: WorkoutSessionUpdate): Promise<WorkoutSession> {
        const response = await apiClient.patch<WorkoutSession>(`/workout-sessions/${sessionId}`, data)
        return response
    }


    /**
     * Récupère toutes les sessions d'un utilisateur avec pagination.
     * Retourne la réponse complète du backend avec rows et count.
     *
     * @param params Paramètres de pagination (limit, offset)
     * @returns Promesse contenant { rows: WorkoutSession[], count: number }
     */
    async getAll(params?: QueryParams) {
        return SessionApi.getAll(params)
    }

    /**
     * Récupère une session de workout par son ID
     * @param sessionId ID de la session
     * @returns Promesse contenant la session
     */
    async getSession(sessionId: string): Promise<WorkoutSession> {
        const response = await apiClient.get<WorkoutSession>(`/workout-sessions/${sessionId}`)
        return response
    }
}



export const sessionService = new SessionService()