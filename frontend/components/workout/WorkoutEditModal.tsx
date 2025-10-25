'use client'

import { workoutsService } from "@/lib/api"
import { Exercise as ExerciseType } from "@/lib/types/exercice"
import { Workouts } from "@/lib/types/workout"
import { GripVertical, Plus, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ExerciseDrawer } from "./ExerciseDrawer"

interface WorkoutEditModalProps {
    isOpen: boolean
    onClose: () => void
    workout: Workouts
}

export default function WorkoutEditModal({
    isOpen,
    onClose,
    workout,
}: WorkoutEditModalProps) {
    const [editedWorkout, setEditedWorkout] = useState<Workouts>(workout)
    const [initialWorkout, setInitialWorkout] = useState<Workouts>(workout)
    const [showExerciseDrawer, setShowExerciseDrawer] = useState(false)
    const [currentSectionIdx, setCurrentSectionIdx] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    // Créer une copie profonde du workout quand il change ou quand la modale s'ouvre
    useEffect(() => {
        if (isOpen) {
            const deepCopy = JSON.parse(JSON.stringify(workout)) as Workouts
            setEditedWorkout(deepCopy)
            setInitialWorkout(deepCopy)
        }
    }, [workout, isOpen])

    /**
    * Cette fonction est utilisée lorsque l'utilisateur souhaite ajouter un exercice à une section.
    * @param {number} sectionIdx - L'index de la section à laquelle l'exercice doit être ajouté.
     */
    const handleAddExercise = (sectionIdx: number) => {
        setCurrentSectionIdx(sectionIdx)
        setShowExerciseDrawer(true)
    }

    /**
     * Cette fonction est appelée lorsque l'utilisateur sélectionne un exercice dans le menu déroulant.
     * Elle ajoute l'exercice sélectionné à la section actuellement éditée.
     * Si la section actuellement éditée n'a pas d'exercices, un tableau d'exercices est créé.
     * L'exercice est converti en format WorkoutExercise.
     * La fonction met à jour l'état de la section actuellement éditée et ferme le menu déroulant.
     */
    const handleSelectExercise = (exercise: ExerciseType) => {
        if (currentSectionIdx === null) return

        const newWorkout = { ...editedWorkout }
        const section = newWorkout.blocks.sections[currentSectionIdx]

        if (!section.exercises) {
            section.exercises = []
        }

        // Convertir l'exercice en format workout exercise
        section.exercises.push({
            name: exercise.name,
            reps: exercise.measurement_type === 'reps' ? '10' : undefined,
            sets: undefined,
            weight: undefined,
            details: exercise.description || undefined
        })

        setEditedWorkout(newWorkout)
        setCurrentSectionIdx(null)
    }

    /**
     * Supprime une section de l'entraînement.
     * @param {number} sectionIdx - Index de la section à supprimer.
     */
    const handleDeleteSection = (sectionIdx: number) => {
        const newWorkout = { ...editedWorkout }
        newWorkout.blocks.sections.splice(sectionIdx, 1)
        setEditedWorkout(newWorkout)
    }

    /**
     * Supprime un exercice d'une section de l'entraînement.
     * @param {number} sectionIdx - Index de la section contenant l'exercice à supprimer.
     * @param {number} exerciseIdx - Index de l'exercice à supprimer dans la section.
     */
    const handleDeleteExercise = (sectionIdx: number, exerciseIdx: number) => {
        const newWorkout = { ...editedWorkout }
        const section = newWorkout.blocks.sections[sectionIdx]
        section?.exercises?.splice(exerciseIdx, 1)
        setEditedWorkout(newWorkout)
    }

    /**
     * Met à jour un champ d'une section de l'entraînement.
     * 
     * @param {number} sectionIdx - Index de la section à mettre à jour.
     * @param {string} field - Nom du champ à mettre à jour.
     * @param {string | number} value - Valeur du champ à mettre à jour.
     */
    const updateSection = (sectionIdx: number, field: string, value: string | number) => {
        const newWorkout = { ...editedWorkout }
        const section = newWorkout.blocks.sections[sectionIdx]
        // @ts-expect-error because field is a string
        section[field] = value
        setEditedWorkout(newWorkout)
    }

    /**
     * Met à jour un champ d'un exercice d'une section de l'entraînement.
     * 
     * @param {number} sectionIdx - Index de la section contenant l'exercice à mettre à jour.
     * @param {number} exerciseIdx - Index de l'exercice à mettre à jour dans la section.
     * @param {string} field - Nom du champ à mettre à jour.
     * @param {string | number} value - Valeur du champ à mettre à jour.
     */
    const updateExercise = (sectionIdx: number, exerciseIdx: number, field: string, value: string | number) => {
        const newWorkout = { ...editedWorkout }
        const exercise = newWorkout.blocks.sections[sectionIdx].exercises?.[exerciseIdx]
        if (exercise) {
            // @ts-expect-error because field is a string
            exercise[field] = value
            setEditedWorkout(newWorkout)
        }
    }

    const handleClose = () => {
        // Restaurer l'état initial
        setEditedWorkout(JSON.parse(JSON.stringify(initialWorkout)) as Workouts)
        onClose()
    }

    const handleSave = async () => {
        if (!editedWorkout) return
        try {
            setLoading(true)
            const payload = {
                ...editedWorkout,
                id: workout.id
            }
            const response = await workoutsService.createPersonalizedWorkout(payload)

            if (response && response.id) {
                toast.success('Workout personnalisé sauvegardé ! Redirection...')
                onClose()

                // Redirection vers le workout personnalisé
                setTimeout(() => {
                    router.push(`/personalized-workout/${response.id}`)
                }, 500)
            } else {
                toast.error('Le workout a été sauvegardé mais aucun ID retourné')
            }
        } catch (error) {
            toast.error(`Erreur lors de la sauvegarde : ${error}`)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0  backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-900 dark:bg-background dark:text-foreground border border-gray-200 dark:border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="border-b border-gray-200 dark:border-border p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">Personnaliser ce workout</h2>
                        <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                            Modifiez les exercices, ajoutez-en ou supprimez-en selon vos besoins
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-accent rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-900 dark:text-foreground" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Workout Info */}
                    <div className="bg-gray-50 dark:bg-accent/30 border border-gray-200 dark:border-border rounded-lg p-4 space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-muted-foreground uppercase tracking-wide">Nom du workout</label>
                            <input
                                type="text"
                                value={editedWorkout.name}
                                onChange={(e) => setEditedWorkout({ ...editedWorkout, name: e.target.value })}
                                className="w-full mt-1.5 px-3 py-2 bg-white dark:bg-card border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-foreground"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-muted-foreground uppercase tracking-wide">Description</label>
                            <textarea
                                value={editedWorkout.description}
                                onChange={(e) => setEditedWorkout({ ...editedWorkout, description: e.target.value })}
                                rows={3}
                                className="w-full mt-1.5 px-3 py-2 bg-white dark:bg-card border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-foreground"
                            />
                        </div>
                    </div>

                    {/* Sections */}
                    {editedWorkout.blocks.sections?.map((section, sectionIdx) => (
                        <div key={sectionIdx} className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg p-4">
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={section.title || `Section ${sectionIdx + 1}`}
                                        onChange={(e) => updateSection(sectionIdx, 'title', e.target.value)}
                                        placeholder="Titre de la section"
                                        className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 w-full text-gray-900 dark:text-foreground"
                                    />
                                    {section.description && (
                                        <textarea
                                            value={section.description}
                                            onChange={(e) => updateSection(sectionIdx, 'description', e.target.value)}
                                            placeholder="Description de la section"
                                            rows={2}
                                            className="text-sm text-gray-600 dark:text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-0 w-full mt-1"
                                        />
                                    )}
                                </div>
                                <button
                                    className="p-2 hover:bg-red-50 dark:hover:bg-destructive/10 hover:text-red-600 dark:hover:text-destructive rounded-lg transition-colors"
                                    title="Supprimer la section"
                                >
                                    <Trash2 className="w-4 h-4"
                                        onClick={() => handleDeleteSection(sectionIdx)}
                                    />
                                </button>
                            </div>

                            {/* Section Config */}
                            {(section.rounds || section.duration_min) && (
                                <div className="flex gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-border">
                                    {section.rounds && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600 dark:text-muted-foreground">Rounds:</span>
                                            <input
                                                type="number"
                                                value={section.rounds}
                                                onChange={(e) => updateSection(sectionIdx, 'rounds', parseInt(e.target.value))}
                                                className="w-16 px-2 py-1 bg-blue-50 dark:bg-accent/40 border border-blue-300 dark:border-primary/30 rounded text-sm text-gray-900 dark:text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary"
                                            />
                                        </div>
                                    )}
                                    {section.duration_min && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600 dark:text-muted-foreground">Durée:</span>
                                            <input
                                                type="number"
                                                value={section.duration_min}
                                                onChange={(e) => updateSection(sectionIdx, 'duration_min', parseInt(e.target.value))}
                                                className="w-16 px-2 py-1 bg-blue-50 dark:bg-accent/40 border border-blue-300 dark:border-primary/30 rounded text-sm text-gray-900 dark:text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-muted-foreground">min</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Exercises */}
                            <div className="space-y-2">
                                {section.exercises?.map((exercise, exerciseIdx) => (
                                    <div
                                        key={exerciseIdx}
                                        className="group flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        {/* Drag Handle */}
                                        <button className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                                        </button>

                                        {/* Exercise Content */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={exercise.name}
                                                    onChange={(e) => updateExercise(sectionIdx, exerciseIdx, 'name', e.target.value)}
                                                    placeholder="Nom de l'exercice"
                                                    className="flex-1 font-medium bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-foreground"
                                                />
                                            </div>

                                            {/* Exercise Details */}
                                            <div className="flex gap-4 flex-wrap">
                                                {exercise.reps && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-600 dark:text-muted-foreground">Reps:</span>
                                                        <input
                                                            type="text"
                                                            value={exercise.reps}
                                                            onChange={(e) => updateExercise(sectionIdx, exerciseIdx, 'reps', e.target.value)}
                                                            className="w-16 px-2 py-1 bg-blue-50 dark:bg-accent/40 border border-blue-300 dark:border-primary/30 rounded text-xs text-gray-900 dark:text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary"
                                                        />
                                                    </div>
                                                )}
                                                {exercise.sets && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-600 dark:text-muted-foreground">Sets:</span>
                                                        <input
                                                            type="number"
                                                            value={exercise.sets}
                                                            onChange={(e) => updateExercise(sectionIdx, exerciseIdx, 'sets', parseInt(e.target.value))}
                                                            className="w-16 px-2 py-1 bg-blue-50 dark:bg-accent/40 border border-blue-300 dark:border-primary/30 rounded text-xs text-gray-900 dark:text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary"
                                                        />
                                                    </div>
                                                )}
                                                {exercise.weight && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-600 dark:text-muted-foreground">Poids:</span>
                                                        <input
                                                            type="text"
                                                            value={exercise.weight}
                                                            onChange={(e) => updateExercise(sectionIdx, exerciseIdx, 'weight', e.target.value)}
                                                            className="w-20 px-2 py-1 bg-blue-50 dark:bg-accent/40 border border-blue-300 dark:border-primary/30 rounded text-xs text-gray-900 dark:text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary"
                                                        />
                                                    </div>
                                                )}
                                                {exercise.distance && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-600 dark:text-muted-foreground">Distance:</span>
                                                        <input
                                                            type="text"
                                                            value={exercise.distance}
                                                            onChange={(e) => updateExercise(sectionIdx, exerciseIdx, 'distance', e.target.value)}
                                                            className="w-20 px-2 py-1 bg-blue-50 dark:bg-accent/40 border border-blue-300 dark:border-primary/30 rounded text-xs text-gray-900 dark:text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary"
                                                        />
                                                    </div>
                                                )}
                                                {exercise.duration && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-600 dark:text-muted-foreground">Durée:</span>
                                                        <input
                                                            type="text"
                                                            value={exercise.duration}
                                                            onChange={(e) => updateExercise(sectionIdx, exerciseIdx, 'duration', e.target.value)}
                                                            className="w-20 px-2 py-1 bg-blue-50 dark:bg-accent/40 border border-blue-300 dark:border-primary/30 rounded text-xs text-gray-900 dark:text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            {exercise.details && (
                                                <input
                                                    type="text"
                                                    value={exercise.details}
                                                    onChange={(e) => updateExercise(sectionIdx, exerciseIdx, 'details', e.target.value)}
                                                    placeholder="Détails"
                                                    className="text-xs text-gray-600 dark:text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                                                />
                                            )}
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            className="mt-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                                            title="Supprimer l'exercice"
                                        >
                                            <Trash2 className="w-4 h-4"
                                                onClick={() => handleDeleteExercise(sectionIdx, exerciseIdx)}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Exercise Button */}
                            <button
                                onClick={() => handleAddExercise(sectionIdx)}
                                className="w-full mt-3 py-2 border border-dashed border-gray-300 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-accent hover:border-blue-400 dark:hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground"
                            >
                                <Plus className="w-4 h-4" />
                                Ajouter un exercice
                            </button>
                        </div>
                    ))}

                    {/* Add Section Button */}
                    <button className="w-full py-3 border-2 border-dashed border-border rounded-lg hover:bg-accent hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                        <Plus className="w-5 h-5" />
                        Ajouter une section
                    </button>
                </div>

                {/* Footer - Actions */}
                <div className="border-t border-border px-6 py-4 bg-accent/20">
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Annuler
                        </button>
                        <button
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Enregistrement...
                                </>
                            ) : (
                                'Enregistrer'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Exercise Drawer */}
            <ExerciseDrawer
                isOpen={showExerciseDrawer}
                onClose={() => setShowExerciseDrawer(false)}
                onSelectExercise={handleSelectExercise}
            />
        </div>
    )
}