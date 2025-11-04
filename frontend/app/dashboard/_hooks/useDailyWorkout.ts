import { useSport } from '@/contexts/SportContext'
import { workoutsService } from '@/lib/api'
import { Workouts } from '@/lib/types/workout'
import { useCallback, useEffect, useState } from 'react'

export function useDailyWorkout() {
    const { activeSport } = useSport()
    const [dailyWorkout, setDailyWorkout] = useState<Workouts | null>(null)
    const [workoutLoading, setWorkoutLoading] = useState(false)

    /**
     * Récupère le workout du jour pour le sport actif.
     * Si le sport actif n'est pas défini, ne fait rien.
     * Si une erreur survient lors de la récupération, affiche null comme workout du jour.
     * Met à jour le statut de chargement du workout du jour.
     */
    const fetchDailyWorkout = useCallback(async () => {
        if (!activeSport) return

        try {
            setWorkoutLoading(true)
            const response = await workoutsService.getDailyWorkout(activeSport.id)
            // getDailyWorkout retourne { rows: Workouts[], count: number }
            // On prend le premier workout du tableau
            setDailyWorkout(response?.rows?.length > 0 ? response.rows[0] : null)
        } catch (err) {
            console.error('Error fetching daily workout:', err)

            // Si 404, essayer de récupérer le dernier workout créé
            if (err instanceof Error && 'statusCode' in err) {
                const errorWithStatus = err as Error & { statusCode: number }
                if (errorWithStatus.statusCode === 404) {
                    try {
                        const latestResponse = await workoutsService.getDailyWorkout(activeSport.id)
                        setDailyWorkout(latestResponse?.rows?.length > 0 ? latestResponse.rows[0] : null)
                        return
                    } catch (latestErr) {
                        console.error('Error fetching latest workout:', latestErr)
                    }
                }
            }

            setDailyWorkout(null)
        } finally {
            setWorkoutLoading(false)
        }
    }, [activeSport])

    useEffect(() => {
        fetchDailyWorkout()
    }, [fetchDailyWorkout])

    return { dailyWorkout, workoutLoading }
}