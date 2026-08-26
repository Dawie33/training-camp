import { Exercise } from '@/domain/entities/workout-structure'

interface ExerciseDisplayProps {
    exercise: Exercise
    isStarting: boolean
    isCompleted: boolean
    onToggle?: () => void
    onExerciseClick?: (exerciseId: string) => void
    rounds?: number // Nombre de rounds de la section parente
}
/**
* Affiche un exercice unique avec ses détails.
*
* @param {ExerciseDisplayProps} props - L'exercice à afficher.
* @returns {JSX.Element} - L'affichage de l'exercice rendu.
 */
export function ExerciseDisplay({ exercise, isCompleted, onToggle, onExerciseClick }: ExerciseDisplayProps) {
    const handleExerciseNameClick = (e: React.MouseEvent) => {
        if (exercise.name && onExerciseClick) {
            e.stopPropagation()
            onExerciseClick(exercise.name)

        }
    }
    return (
        <div
            onClick={onToggle}
            className={`text-xs py-1 ${onToggle ? 'cursor-pointer' : ''} ${isCompleted ? 'opacity-50' : ''}`}
        >
            <p className="text-muted-foreground">
                <span
                    className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'} ${exercise.name && onExerciseClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                    onClick={handleExerciseNameClick}
                >
                    {exercise.name}
                </span>
                {exercise.reps && <span> · {exercise.reps} répétition{typeof exercise.reps === 'number' && exercise.reps > 1 ? 's' : ''}</span>}
                {exercise.duration && <span> · {exercise.duration}</span>}
                {exercise.work_duration && <span> · {exercise.work_duration} travail</span>}
                {exercise.rest_duration && <span> · {exercise.rest_duration} repos</span>}
                {exercise.distance && <span> · {exercise.distance}</span>}
                {exercise.weight && <span className="text-primary"> · {exercise.weight}</span>}
                {exercise.intensity && <span> · Intensité: {exercise.intensity}</span>}
                {exercise.pace && <span> · Allure: {exercise.pace}</span>}
                {exercise.effort && <span> · Effort: {exercise.effort}</span>}
                {exercise.tempo && <span> · Tempo: {exercise.tempo}</span>}
                {exercise.cadence && <span> · Cadence: {exercise.cadence}</span>}
                {exercise.per_side && <span> · par côté</span>}
            </p>
            {exercise.details && (
                <p className="text-[11px] text-muted-foreground/70 italic mt-0.5">{exercise.details}</p>
            )}
        </div>
    )
}