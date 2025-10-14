import { useSport } from "@/contexts/SportContext"
import { getSportImage } from "@/lib/utils/sport-images"
import Link from "next/link"
import { useRecommendedWorkouts } from "../_hooks/useRecommendedWorkouts"

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
                    <Link href={`/workout/${workout.id}`} className="block group">
                        <div className="relative aspect-[4/3] bg-card rounded-lg border border-border overflow-hidden cursor-pointer">
                            {/* Image de fond */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                                style={{
                                    backgroundImage: `url(${getSportImage(workout?.slug || 'default', workout.id)})`,
                                }}
                            />
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                            {/* Contenu */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold px-2 py-1 bg-primary/90 text-primary-foreground rounded">
                                            WORKOUT DU JOUR
                                        </span>
                                        <span className="text-sm text-white/90">{new Date(workout.scheduled_date).toLocaleDateString('fr-FR')}</span>
                                    </div>

                                    {workout.blocks?.duration_min != null && (
                                        <div>
                                            <span className="text-sm font-semibold px-2 py-1 bg-black/50 text-white rounded">
                                                {workout.blocks?.duration_min} min
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">
                                        {workout.name || `${activeSport?.name} Workout`}
                                    </h2>

                                    {/* Type, Difficulté et Durée */}
                                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                                        {workout.workout_type && (
                                            <span className="text-sm font-medium px-3 py-1 bg-primary/90 text-primary-foreground rounded-full uppercase">
                                                {workout.workout_type}
                                            </span>
                                        )}
                                        {workout.difficulty && (
                                            <span className="text-sm font-medium px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full">
                                                {workout.difficulty === 'beginner' && '🟢 Débutant'}
                                                {workout.difficulty === 'intermediate' && '🟡 Intermédiaire'}
                                                {workout.difficulty === 'advanced' && '🔴 Avancé'}
                                            </span>
                                        )}
                                        {workout.estimated_duration && (
                                            <span className="text-sm font-medium px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full">
                                                ⏱️ {workout.estimated_duration} min
                                            </span>
                                        )}
                                    </div>

                                    {workout.blocks?.stimulus && (
                                        <p className="text-white/90 text-sm mb-3">{workout.blocks?.stimulus}</p>
                                    )}
                                    {workout.tags && workout.tags.length > 0 && (
                                        <div className="flex gap-2 flex-wrap">
                                            {workout.tags.map((tag, idx) => (
                                                <span key={idx} className="text-xs px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}