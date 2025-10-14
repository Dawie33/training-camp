'use client'

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import {
    Card
} from "@/components/ui/card"
import { getWorkouts, sportsService } from "@/lib/api"
import { AdminWorkout } from "@/lib/types/workout"
import { getSportImage } from "@/lib/utils/sport-images"
import { useCallback, useEffect, useState } from 'react'
import { toast } from "sonner"

function ExploreContent() {
    const [loading, setLoading] = useState(true)
    const [workouts, setWorkouts] = useState<AdminWorkout[]>([])
    const [selectedSport, setSelectedSport] = useState<string | null>(null)
    const activeSport = localStorage.getItem('active_sport') ?? undefined

    console.log(activeSport)
    const fetchSports = useCallback(async () => {
        try {
            const params: Record<string, string | number | undefined> = {
                slug: activeSport
            }
            const { rows: sports } = await sportsService.getAll(params)
            setSelectedSport(sports[0]?.id)
        } catch (error) {
            console.error('Erreur lors du chargement des sports', error)
            toast.error('Erreur lors du chargement des sports')
        }
    }, [activeSport])

    const fetchWorkouts = useCallback(async () => {
        try {
            setLoading(true)
            const params: Record<string, string | number | undefined> = {
                limit: 20,
                status: 'published',
                sport_id: selectedSport || undefined,
            }

            const data = await getWorkouts(params)
            setWorkouts(data.rows)
        } catch (error) {
            console.log(error)
            toast.error('Erreur dans la récupération des workouts')
        } finally {
            setLoading(false)
        }
    }, [selectedSport])


    useEffect(() => {
        fetchSports()
    }, [fetchSports])

    useEffect(() => {
        fetchWorkouts()
    }, [fetchWorkouts])

    return (
        <div >
            {loading ? (
                <div className="aspect-[4/3] bg-card rounded-lg border border-border flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    <div className="lg:col-span-2" >
                        <div className="relative h-120 bg-card rounded-lg border border-border overflow-hidden cursor-pointer">
                            {/* Image de fond */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                                style={{
                                    backgroundImage: `url(${getSportImage(activeSport || 'default', 'crossfit')})`,
                                }}
                            />


                        </div>
                    </div>

                    {workouts.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                            {workouts.map((workout) => (
                                <Card
                                    key={workout.id}
                                    onClick={() => setSelectedSport(workout.id === selectedSport ? null : workout.id)}
                                    className={`group relative overflow-hidden rounded-2xl border border-border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer ${workout.id === selectedSport ? 'border-primary shadow-primary/40' : ''
                                        }`}
                                >
                                    {/* Image de fond */}
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                        style={{
                                            backgroundImage: `url(${getSportImage(activeSport || 'default', workout.id)})`,
                                        }}
                                    />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />

                                    {/* Contenu */}
                                    <div className="relative z-10 p-5 flex flex-col justify-between h-full">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                                                {workout.name}
                                            </h3>
                                            <p className="text-sm text-gray-200 line-clamp-2">
                                                {workout.description || 'Aucun descriptif disponible'}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center mt-4 text-sm text-gray-300">
                                            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-medium">
                                                {workout.difficulty || 'Tous niveaux'}
                                            </span>
                                            <span>{workout.estimated_duration ? `${workout.estimated_duration} min` : '—'}</span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}


                </>
            )}
        </div>

    )
}

export default function ExplorePage() {
    return (
        <ProtectedRoute>
            <ExploreContent />
        </ProtectedRoute>
    )
}

