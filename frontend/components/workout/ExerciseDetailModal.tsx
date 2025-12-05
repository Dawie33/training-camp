'use client'

import { Equipment } from '@/domain/entities/equipment'
import { Exercise } from '@/domain/entities/exercice'
import { getEquipment } from '@/services/equipments'
import { getExercises } from '@/services/exercices'
import { AlertCircle, Dumbbell, ExternalLink, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'

interface ExerciseDetailModalProps {
    exerciseName: string
    isOpen: boolean
    onClose: () => void
}

export function ExerciseDetailModal({ exerciseName, isOpen, onClose }: ExerciseDetailModalProps) {
    const [exercise, setExercise] = useState<Exercise | null>(null)
    const [equipments, setEquipments] = useState<Equipment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isOpen || !exerciseName) {
            return
        }

        const fetchExerciseDetails = async () => {
            console.log(exerciseName)
            try {
                setLoading(true)

                // Récupérer l'exercice
                const { rows: exerciseData } = await getExercises({ search: exerciseName })
                const foundExercise = exerciseData?.[0]
                setExercise(foundExercise)

                // Récupérer les équipements si nécessaire
                if (foundExercise?.equipment_required && Array.isArray(foundExercise.equipment_required)) {
                    const equipmentPromises = foundExercise.equipment_required.map(id => getEquipment(id))
                    const equipmentData = await Promise.all(equipmentPromises)
                    setEquipments(equipmentData)
                }
            } catch (err) {
                toast.error(`Une erreur est survenue lors de la recherche de l\`exercice: ${err}')}`)
            } finally {
                setLoading(false)
            }
        }

        fetchExerciseDetails()
    }, [exerciseName, isOpen])

    if (!isOpen) return null

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const difficultyLabels = {
        beginner: 'Débutant',
        intermediate: 'Intermédiaire',
        advanced: 'Avancé'
    }

    const categoryLabels = {
        strength: 'Force',
        cardio: 'Cardio',
        gymnastics: 'Gymnastique',
        olympic_lifting: 'Haltérophilie',
        powerlifting: 'Force athlétique',
        endurance: 'Endurance',
        mobility: 'Mobilité'
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-2xl font-bold">Détails de l'exercice</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    )}


                    {!loading && exercise && (
                        <div className="space-y-6">
                            {/* Titre et badges */}
                            <div>
                                <h3 className="text-3xl font-bold mb-3">{exercise.name}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {exercise.category && (
                                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                            {categoryLabels[exercise.category] || exercise.category}
                                        </span>
                                    )}
                                    {exercise.difficulty && (
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${exercise.difficulty === 'beginner' ? 'bg-green-500/10 text-green-500' :
                                            exercise.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-500' :
                                                'bg-red-500/10 text-red-500'
                                            }`}>
                                            {difficultyLabels[exercise.difficulty]}
                                        </span>
                                    )}
                                    {exercise.bodyweight_only && (
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm font-medium">
                                            Poids du corps uniquement
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Image */}
                            {exercise.image_url && (
                                <div className="rounded-lg overflow-hidden border border-border">
                                    <img
                                        src={exercise.image_url}
                                        alt={exercise.name}
                                        className="w-full h-64 object-cover"
                                    />
                                </div>
                            )}

                            {/* Description */}
                            {exercise.description && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info className="w-5 h-5 text-primary" />
                                        <h4 className="font-semibold text-lg">Description</h4>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed">{exercise.description}</p>
                                </div>
                            )}

                            {/* Instructions */}
                            {exercise.instructions && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info className="w-5 h-5 text-primary" />
                                        <h4 className="font-semibold text-lg">Instructions</h4>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{exercise.instructions}</p>
                                </div>
                            )}

                            {/* Groupes musculaires */}
                            {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Groupes musculaires</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {exercise.muscle_groups.map((muscle, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">
                                                {muscle}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Équipements requis */}
                            {equipments.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Dumbbell className="w-5 h-5 text-primary" />
                                        <h4 className="font-semibold text-lg">Équipements requis</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {equipments.map((equipment) => (
                                            <div
                                                key={equipment.id}
                                                className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg border border-border"
                                            >
                                                {equipment.image_url ? (
                                                    <img
                                                        src={equipment.image_url}
                                                        alt={equipment.label}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                                        <Dumbbell className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium">{equipment.label}</p>
                                                    {equipment.description && (
                                                        <p className="text-xs text-muted-foreground">{equipment.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Vidéo */}
                            {exercise.video_url && (
                                <div className="pt-4 border-t">
                                    <h3 className="font-semibold mb-4">Video Tutorial</h3>
                                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/5 border">
                                        {(() => {
                                            // YouTube
                                            const youtubeMatch = exercise.video_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*)/)
                                            if (youtubeMatch && youtubeMatch[1]) {
                                                return (
                                                    <iframe
                                                        src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                                                        className="w-full h-full"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        title={exercise.name}
                                                    />
                                                )
                                            }

                                            // Vimeo
                                            const vimeoMatch = exercise.video_url?.match(/(?:vimeo\.com\/)([0-9]+)/)
                                            if (vimeoMatch && vimeoMatch[1]) {
                                                return (
                                                    <iframe
                                                        src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                                                        className="w-full h-full"
                                                        allow="autoplay; fullscreen; picture-in-picture"
                                                        allowFullScreen
                                                        title={exercise.name}
                                                    />
                                                )
                                            }

                                            // Direct video file (basic check)
                                            if (exercise.video_url?.match(/\.(mp4|webm|ogg)$/i)) {
                                                return (
                                                    <video
                                                        controls
                                                        className="w-full h-full"
                                                        src={exercise.video_url}
                                                    >
                                                        Your browser does not support the video tag.
                                                    </video>
                                                )
                                            }

                                            // Fallback to link
                                            return (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 p-6 text-center">
                                                    <p className="text-muted-foreground mb-4">Video preview not available for this URL format.</p>
                                                    <Button asChild variant="outline">
                                                        <a
                                                            href={exercise.video_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2"
                                                        >
                                                            Watch on external site
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Notes de sécurité */}
                            {exercise.safety_notes && (
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-yellow-500 mb-1">Notes de sécurité</h4>
                                            <p className="text-sm text-muted-foreground">{exercise.safety_notes}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {(!exercise && !loading) && (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">Aucun exercice trouvé</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    )
}
