import { WorkoutSection } from '@/domain/entities/workout-structure'
import { ExerciseDisplay } from './ExerciseDisplay'
import { ExerciseSlider } from './ExerciseSlider'
import { Check, X } from 'lucide-react'

interface SectionActiveModeProps {
  section: WorkoutSection
  onClose: () => void
  onAllExercisesCompleted: () => void
  onExerciseClick?: (exerciseId: string) => void
}

export function SectionActiveMode({
  section,
  onClose,
  onAllExercisesCompleted,
  onExerciseClick,
}: SectionActiveModeProps) {
  const isAMRAP = section.type === 'amrap' || section.format?.toLowerCase().includes('amrap')
  const isStrengthWithRest = !isAMRAP && !!section.rounds && section.rounds > 1 && !!section.rest_between_rounds

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-auto">
      <div className="min-h-screen p-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{section.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {section.description && <p className="text-sm text-slate-400 mb-4">{section.description}</p>}

        <div className="mt-4">
          {isAMRAP || isStrengthWithRest ? (
            <>
              <div className="space-y-3">
                {(section.exercises ?? []).map((exercise, idx) => (
                  <ExerciseDisplay
                    key={idx}
                    exercise={exercise}
                    isStarting={false}
                    isCompleted={false}
                    onExerciseClick={onExerciseClick}
                  />
                ))}
              </div>
              {isAMRAP && (
                <button
                  onClick={onAllExercisesCompleted}
                  className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-semibold text-base shadow-lg shadow-green-500/30"
                >
                  <Check className="w-5 h-5" />
                  <span>Terminer la section</span>
                </button>
              )}
            </>
          ) : (
            <ExerciseSlider
              exercises={section.exercises ?? []}
              rounds={section.rounds}
              onExerciseClick={onExerciseClick}
              onAllExercisesCompleted={onAllExercisesCompleted}
            />
          )}
        </div>
      </div>
    </div>
  )
}
