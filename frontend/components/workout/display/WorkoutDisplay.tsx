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
    <div className="space-y-3 lg:space-y-4">
      {blocks.stimulus && (
        <div className="bg-card border border-border rounded-lg p-3 lg:p-4">
          <h3 className="text-xs font-semibold text-primary mb-1">Objectif</h3>
          <p className="text-foreground text-xs lg:text-sm">{blocks.stimulus}</p>
        </div>
      )}

      <div className="space-y-2">
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
        <div className="text-sm text-muted-foreground text-center pt-4 border-t border-border">
          Estimation : {blocks.estimated_calories} calories
        </div>
      )}
    </div>
  )
}

