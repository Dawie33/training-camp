import { Exercise } from '@/lib/types/workout-structure'
import { Check } from 'lucide-react'

interface ExerciseDisplayProps {
    exercise: Exercise
    isStarting: boolean
    isCompleted: boolean
    onToggle?: () => void
    rounds?: number // Nombre de rounds de la section parente
}
/**
* Affiche un exercice unique avec ses détails.
*
* @param {ExerciseDisplayProps} props - L'exercice à afficher.
* @returns {JSX.Element} - L'affichage de l'exercice rendu.
 */
export function ExerciseDisplay({ exercise, isStarting, isCompleted, onToggle }: ExerciseDisplayProps) {
    return (
        <div
            onClick={onToggle}
            className={`text-sm p-3 rounded-lg border transition-all ${onToggle ? 'cursor-pointer hover:border-primary/50' : ''} ${isCompleted
                ? 'bg-primary/10 border-primary/50 line-through opacity-60'
                : 'bg-card border-border'
                }`}
        >
            <div className="flex items-start gap-3">
                {isStarting && (<div
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : 'border-2 border-muted-foreground'
                        }`}
                >
                    {isCompleted && <Check className="w-3 h-3" />}
                </div>
                )}
                <div className="flex-1">
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-muted-foreground flex flex-wrap gap-2 mt-1">
                        {exercise.reps && <span>• {exercise.reps} répétition{typeof exercise.reps === 'number' && exercise.reps > 1 ? 's' : ''}</span>}
                        {exercise.duration && <span>• {exercise.duration}</span>}
                        {exercise.work_duration && <span>• {exercise.work_duration} travail</span>}
                        {exercise.rest_duration && <span>• {exercise.rest_duration} repos</span>}
                        {exercise.distance && <span>• {exercise.distance}</span>}
                        {exercise.weight && <span>• {exercise.weight}</span>}
                        {exercise.intensity && <span>• Intensité: {exercise.intensity}</span>}
                        {exercise.pace && <span>• Allure: {exercise.pace}</span>}
                        {exercise.effort && <span>• Effort: {exercise.effort}</span>}
                        {exercise.tempo && <span>• Tempo: {exercise.tempo}</span>}
                        {exercise.cadence && <span>• Cadence: {exercise.cadence}</span>}
                        {exercise.per_side && <span>• par côté</span>}
                    </div>
                    {exercise.details && (
                        <div className="text-xs text-muted-foreground italic mt-1">{exercise.details}</div>
                    )}
                </div>
            </div>
        </div>
    )
}