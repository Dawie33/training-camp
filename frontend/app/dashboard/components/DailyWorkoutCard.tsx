'use client'

import { useSport } from '@/contexts/SportContext'
import { getSportImage } from '@/lib/utils/sport-images'
import Link from 'next/link'
import { useDailyWorkout } from '../_hooks/useDailyWorkout'

/**
 * Composant affichant le workout du jour pour le sport actif.
 * Si le sport actif n'est pas défini, affiche un message d'erreur.
 * Si le workout du jour n'a pas encore été publié, affiche un message d'attente.
 * Si une erreur survient lors de la récupération, affiche un message d'erreur.
 * Met à jour le statut de chargement du workout du jour.
 */
export function DailyWorkoutCard() {
    const { activeSport } = useSport()
    const { dailyWorkout, workoutLoading } = useDailyWorkout()

    return (
        <div>
            {workoutLoading ? (
                <div className="aspect-[21/9] bg-card rounded-lg border border-border flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : dailyWorkout ? (
                <Link href={`/workout/${dailyWorkout.id}`} className="block group">
                    <div className="relative aspect-[21/9] bg-card rounded-lg border border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-all">
                        {/* Image de fond */}
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                            style={{
                                backgroundImage: `url(${getSportImage(activeSport?.slug || 'default', dailyWorkout.id)})`,
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
                                    <span className="text-sm text-white/90">{new Date(dailyWorkout.scheduled_date).toLocaleDateString('fr-FR')}</span>
                                </div>

                                {dailyWorkout.blocks?.duration_min != null && (
                                    <div>
                                        <span className="text-sm font-semibold px-2 py-1 bg-black/50 text-white rounded">
                                            {dailyWorkout.blocks?.duration_min} min
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    {dailyWorkout.name || `${activeSport?.name} Workout`}
                                </h2>

                                {/* Type, Difficulté et Durée */}
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                    {dailyWorkout.workout_type && (
                                        <span className="text-sm font-medium px-3 py-1 bg-primary/90 text-primary-foreground rounded-full uppercase">
                                            {dailyWorkout.workout_type}
                                        </span>
                                    )}
                                    {dailyWorkout.difficulty && (
                                        <span className="text-sm font-medium px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full">
                                            {dailyWorkout.difficulty === 'beginner' && '🟢 Débutant'}
                                            {dailyWorkout.difficulty === 'intermediate' && '🟡 Intermédiaire'}
                                            {dailyWorkout.difficulty === 'advanced' && '🔴 Avancé'}
                                        </span>
                                    )}
                                    {dailyWorkout.estimated_duration && (
                                        <span className="text-sm font-medium px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full">
                                            ⏱️ {dailyWorkout.estimated_duration} min
                                        </span>
                                    )}
                                </div>

                                {dailyWorkout.blocks?.stimulus && (
                                    <p className="text-white/90 text-sm mb-3">{dailyWorkout.blocks?.stimulus}</p>
                                )}
                                {dailyWorkout.tags && dailyWorkout.tags.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        {dailyWorkout.tags.map((tag, idx) => (
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
            ) : (
                <div className="aspect-[21/9] bg-card rounded-lg border border-border flex items-center justify-center text-center p-6">
                    <div>
                        <p className="text-lg font-semibold mb-2">Aucun workout disponible</p>
                        <p className="text-sm text-muted-foreground">Le workout du jour n'a pas encore été publié</p>
                    </div>
                </div>
            )}
        </div>
    )
}
