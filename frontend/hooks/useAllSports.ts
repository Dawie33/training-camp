import { sportsService } from "@/services"
import { Sport } from "@/domain/entities/sport"
import { useCallback, useEffect, useState } from "react"



/**
 * Hook pour récupérer la liste de tous les sports.
 * Retourne un triplet d'état contenant la liste des sports, un booléen indiquant si les sports sont en cours de chargement et un message d'erreur.
 * Les sports sont récupérés via le service sportsService.
 * La fonction fetchSports est appelée une seule fois au montage du composant.
 * Les états sont mis à jour en cas de succès ou d'erreur.
 * @returns {sports: Sport[], loading: boolean, error: string | null}
 */
export function useAllSports() {
    const [sports, setSports] = useState<Sport[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)


    const fetchSports = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const results = await sportsService.getAll()
            setSports(results.rows)
        } catch (err) {
            console.error('Erreur lors du chargement des sports', err)
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement des sports')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSports()
    }, [fetchSports])

    return {
        sports,
        loading,
        error
    }
}