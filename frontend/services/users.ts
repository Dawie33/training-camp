import { UpdateUserDTO, User } from "@/domain/entities/auth"
import apiClient from "./apiClient"

export class UsersService {

    /**
     * Récupère le profil de l'utilisateur connecté.
     * L'ID de l'utilisateur est automatiquement récupéré depuis le token JWT.
     * @returns {Promise<User>} - Promesse qui renvoie l'utilisateur connecté.
     * Les stats de l'utilisateur sont également récupérés et incluent le nombre de workout et de sessions qu'il a créées.
     */
    async getUserProfile(): Promise<User> {
        const response = await apiClient.get<User>('/users/me')
        return response
    }

    async updateMe(data: UpdateUserDTO): Promise<User> {
        return apiClient.patch<User>('/users/me', data)
    }
}

export const usersService = new UsersService()