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
            const date = new Date().toISOString().split('T')[0]
            const workout = await workoutsService.getDailyWorkout(activeSport.id, date)
            setDailyWorkout(workout)
        } catch (err) {
            console.error('Error fetching daily workout:', err)

            // Si 404, essayer de récupérer le dernier workout créé
            if (err instanceof Error && 'statusCode' in err) {
                const errorWithStatus = err as Error & { statusCode: number }
                if (errorWithStatus.statusCode === 404) {
                    try {
                        const latestWorkout = await workoutsService.getDailyWorkout(activeSport.id)
                        setDailyWorkout(latestWorkout)
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