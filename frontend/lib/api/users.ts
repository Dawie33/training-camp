import { User } from "../types/auth"
import { SaveBenchmarkResultDto } from "../types/benchmark"
import apiClient from "./apiClient"

export class UsersService {

    /**
     * Récupère le profil de l'utilisateur connecté.
     * L'ID de l'utilisateur est automatiquement récupéré depuis le token JWT.
     * @param sportId - ID du sport actif (optionnel) pour récupérer le niveau spécifique au sport
     * @returns {Promise<User>} - Promesse qui renvoie l'utilisateur connecté.
     * Le résultat inclut le mot de passe de l'utilisateur qui est masqué.
     * Les stats de l'utilisateur sont également récupérés et incluent le nombre de workout et de sessions qu'il a créées.
     */
    async getUserProfile(sportId?: string): Promise<User> {
        const params = sportId ? { sportId } : {}
        const response = await apiClient.get<User>('/users/me', { params })
        return response
    }

    /**
     * Enregistre le résultat d'un benchmark
     * Le niveau de l'utilisateur sera automatiquement calculé et mis à jour
     * @param data Données du résultat du benchmark
     * @returns Promesse contenant le nouveau niveau et les résultats mis à jour
     */
    async saveBenchmarkResult(data: SaveBenchmarkResultDto): Promise<{
        success: boolean
        level: 'beginner' | 'intermediate' | 'advanced' | 'elite'
        benchmark_results: Record<string, unknown>
    }> {
        const response = await apiClient.post<{
            success: boolean
            level: 'beginner' | 'intermediate' | 'advanced' | 'elite'
            benchmark_results: Record<string, unknown>
        }>('/users/benchmark-result', data)
        return response
    }
}

export const usersService = new UsersService()