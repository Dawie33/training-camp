import { SECTION_TYPE_COLORS, WorkoutSection } from '@/domain/entities/workout-structure'
import { useState } from 'react'
import { SectionHeader } from './SectionHeader'
import { SectionMeta } from './SectionMeta'
import { SectionInstructions } from './SectionInstructions'
import { SectionExercisesList } from './SectionExercisesList'
import { SectionIntervals } from './SectionIntervals'
import { SectionActiveMode } from './SectionActiveMode'

interface SectionDisplayProps {
  section: WorkoutSection
  index: number
  isStarting?: boolean
  isSectionCompleted?: boolean
  onSectionToggle?: () => void
  isCurrentSection?: boolean
  onSectionStart?: () => void
  onExerciseClick?: (exerciseId: string) => void
  canStart?: boolean
}

export function SectionDisplay({
  section,
  index,
  isStarting,
  isSectionCompleted,
  onSectionToggle,
  isCurrentSection,
  onSectionStart,
  onExerciseClick,
  canStart = true,
}: SectionDisplayProps) {
  const [isActiveMode, setIsActiveMode] = useState(false)

  const handleStartSection = () => {
    setIsActiveMode(true)
    onSectionStart?.()
  }

  const handleCloseActiveMode = () => {
    setIsActiveMode(false)
  }

  const handleAllExercisesCompleted = () => {
    onSectionToggle?.()
    setTimeout(() => {
      setIsActiveMode(false)
    }, 1000)
  }

  if (isActiveMode && section.exercises && section.exercises.length > 0) {
    return (
      <SectionActiveMode
        section={section}
        onClose={handleCloseActiveMode}
        onAllExercisesCompleted={handleAllExercisesCompleted}
        onExerciseClick={onExerciseClick}
      />
    )
  }

  return (
    <div
      className={`border-l-4 ${SECTION_TYPE_COLORS[section.type] ?? 'border-l-border'} bg-card border border-border rounded-r-lg pl-3 pr-3 py-2.5 space-y-2 ${isCurrentSection ? 'ring-2 ring-primary/50' : ''} ${isSectionCompleted ? 'opacity-60' : ''}`}
    >
      <SectionHeader
        title={section.title}
        description={section.description}
        duration_min={section.duration_min}
        isSectionCompleted={isSectionCompleted}
      />

      <SectionMeta format={section.format} goal={section.goal} focus={section.focus} />

      <SectionInstructions
        rounds={section.rounds}
        rest_between_rounds={section.rest_between_rounds}
        between_rounds_task={section.between_rounds_task}
      />

      {section.exercises && section.exercises.length > 0 && (
        <SectionExercisesList
          exercises={section.exercises}
          rounds={section.rounds}
          isStarting={isStarting}
          isSectionCompleted={isSectionCompleted}
          canStart={canStart}
          onExerciseClick={onExerciseClick}
          onStartSection={handleStartSection}
        />
      )}

      <SectionIntervals intervals={section.intervals} rounds={section.rounds} />

      {section.sections && section.sections.length > 0 && (
        <div className="space-y-2">
          {section.sections.map((subsection, subIdx) => (
            <SectionDisplay
              key={subIdx}
              section={subsection}
              index={index}
              isStarting={isStarting}
              isSectionCompleted={false}
              onSectionToggle={undefined}
              isCurrentSection={false}
              onSectionStart={onSectionStart}
              onExerciseClick={onExerciseClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
