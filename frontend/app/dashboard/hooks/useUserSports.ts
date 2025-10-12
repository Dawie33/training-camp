import { useSport } from "@/contexts/SportContext"
import { useAuth } from "@/hooks/useAuth"
import { authService, sportsService } from "@/lib/api"
import { useCallback, useEffect, useState } from "react"

export function useUserSports() {
    const { user } = useAuth()
    const { setUserSports } = useSport()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    /**
     * Récupère les sports pratiqués par l'utilisateur en consultant le profil de l'utilisateur et la liste des sports disponibles.
     * Met à jour l'état du contexte sportif avec la liste des sports de l'utilisateur.
     * En cas d'erreur, met à jour l'état d'erreur et le statut de chargement.
     */
    const fetchUserSports = useCallback(async () => {
        if (!user) return

        try {
            setLoading(true)
            setError(null)

            // Récupérer le profil complet de l'utilisateur
            const profile = await authService.getFullProfile()

            // Récupérer tous les sports disponibles
            const { rows: allSports } = await sportsService.getAll()

            const userSportSlugs: string[] = []
            if (profile.primary_sport) {
                userSportSlugs.push(profile.primary_sport)
            }
            if (profile.sports_practiced) {
                const practiced = typeof profile.sports_practiced === 'string'
                    ? JSON.parse(profile.sports_practiced)
                    : profile.sports_practiced
                userSportSlugs.push(...practiced)
            }

            // Filtrer les doublons
            const uniqueSlugs = Array.from(new Set(userSportSlugs))

            // Trouver les sports correspondants
            const userSportsList = allSports.filter(sport =>
                uniqueSlugs.includes(sport.slug)
            )

            setUserSports(userSportsList)
        } catch (error) {
            console.error('Error fetching user sports:', error)
            setError(error instanceof Error ? error.message : 'Erreur dans la récupération des sports')
        } finally {
            setLoading(false)
        }
    }, [user, setUserSports])

    useEffect(() => {
        fetchUserSports()
    }, [fetchUserSports])

    return { loading, error }
}


