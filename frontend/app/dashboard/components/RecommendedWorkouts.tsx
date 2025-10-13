import { WorkoutCard } from "@/components/workout/WorkoutCard"
import { useSport } from "@/contexts/SportContext"
import { getSportImage } from "@/lib/utils/sport-images"
import { useRecommendedWorkouts } from "../hooks/useRecommendedWorkouts"

export function RecommendedWorkouts() {
    const { activeSport } = useSport()
    const { recommendedWorkouts, loading, error } = useRecommendedWorkouts(4)

    if (loading) {
        return (
            <div>
                <h2 className="text-3xl font-bold mb-6">Recommandé pour toi</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-[3/4] bg-card rounded-lg border animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div>
                <h2 className="text-3xl font-bold mb-6">Recommandé pour toi</h2>
                <p className="text-red-500">Erreur: {error}</p>
            </div>
        )
    }

    if (recommendedWorkouts.length === 0) {
        return (
            <div>
                <h2 className="text-3xl font-bold mb-6">Recommandé pour toi</h2>
                <p className="text-muted-foreground">Aucun workout disponible pour le moment</p>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Recommandé pour toi</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedWorkouts.map((workout) => (
                    <WorkoutCard
                        key={workout.id}
                        title={workout.name}
                        duration={`${workout.estimated_duration || 30} min`}
                        image={getSportImage(activeSport?.slug || 'default', workout.id)}
                        category={workout.workout_type || 'WORKOUT'}
                        isNew={false}
                    />
                ))}
            </div>
        </div>
    )
}