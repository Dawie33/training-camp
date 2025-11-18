import { CreateUserDTO, UpdateUserDTO, User, UserQueryParams } from "../types/auth"
import apiClient from "./apiClient"
import ResourceApi from "./resourceApi"


export const usersApi = new ResourceApi<User, CreateUserDTO, UpdateUserDTO>('/users')
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

    async getUsers(params?: UserQueryParams) {
        return usersApi.getAll(params)
    }

    async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
        return usersApi.update(id, data)
    }

    async deleteUser(id: string): Promise<void> {
        return usersApi.delete(id)
    }

}

export const usersService = new UsersService()