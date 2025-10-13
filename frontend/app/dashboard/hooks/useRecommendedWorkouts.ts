import { useSport } from "@/contexts/SportContext"
import { workoutsService } from "@/lib/api"
import { Workouts } from "@/lib/types/workout"
import { useCallback, useEffect, useState } from "react"

export function useRecommendedWorkouts(limit: number = 4) {
    const { activeSport } = useSport()
    const [recommendedWorkouts, setRecommendedWorkouts] = useState<Workouts[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchRecommendedWorkouts = useCallback(async () => {
        if (!activeSport) return

        try {
            setLoading(true)
            setError(null)
            const { rows } = await workoutsService.getRecommendedWorkouts(activeSport.id, limit)
            setRecommendedWorkouts(rows)
        } catch (err) {
            console.error('Error fetching recommended workouts:', err)
            setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des workouts recommandés')
            setRecommendedWorkouts([])
        } finally {
            setLoading(false)
        }
    }, [activeSport, limit])

    useEffect(() => {
        fetchRecommendedWorkouts()
    }, [fetchRecommendedWorkouts])

    return { recommendedWorkouts, loading, error, refetch: fetchRecommendedWorkouts }
}