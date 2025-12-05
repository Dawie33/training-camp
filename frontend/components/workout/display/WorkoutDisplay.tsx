import { WorkoutBlocks } from '@/domain/entities/workout-structure'
import { SectionDisplay } from './SectionDisplay'

interface WorkoutDisplayProps {
  blocks: WorkoutBlocks
  showTitle?: boolean
  isStarting?: boolean
  onExerciseClick?: (exerciseId: string) => void
}

/**
 * Affiche un workout complet avec ses blocs et exercices.
 * @param {WorkoutDisplayProps} props - Les propriétés de l'affichage du workout.
 * @returns {JSX.Element} - L'affichage du workout rendu.
 */
export function WorkoutDisplay({ blocks, isStarting, onExerciseClick }: WorkoutDisplayProps) {
  return (
    <div className="space-y-6">
      {blocks.stimulus && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🎯 Objectif</h3>
          <p className="text-blue-800 dark:text-blue-200">{blocks.stimulus}</p>
        </div>
      )}

      <div className="space-y-4">
        {blocks.sections.map((section, idx) => (
          <SectionDisplay
            key={idx}
            section={section}
            index={idx}
            isStarting={isStarting}
            onExerciseClick={onExerciseClick}
          />
        ))}
      </div>

      {blocks.estimated_calories && (
        <div className="text-sm text-muted-foreground text-center pt-4 border-t">
          🔥 Estimation : {blocks.estimated_calories} calories
        </div>
      )}
    </div>
  )
}

