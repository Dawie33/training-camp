import { WorkoutSection } from '@/lib/types/workout-structure'
import { AMRAPTimer } from '../timers/AMRAPTimer'
import { EMOMTimer } from '../timers/EMOMTimer'
import { ForTimeTimer } from '../timers/ForTimeTimer'
import { TabataTimer } from '../timers/TabataTimer'
import { ExerciseDisplay } from './ExerciseDisplay'
import { sectionIcons } from './SectionIcons'

interface SectionDisplayProps {
    section: WorkoutSection
    index: number
    isStarting?: boolean
    isExerciseCompleted?: (sectionIdx: number, exerciseIdx: number) => boolean
    toggleExercise?: (sectionIdx: number, exerciseIdx: number) => void
    isCurrentSection?: boolean
    onSectionStart?: () => void
}

/**
* Composant SectionDisplay.
*
* Ce composant permet d'afficher une section d'un entraînement.
* Il affiche le titre, la description, la durée, le format, l'objectif, le focus, les rounds, le temps de repos entre les rounds et les exercices.
* Il affiche également les détails des intervalles si la section en comporte.
* Si la section comporte des sous-sections, il s'affiche de manière récursive pour chaque sous-section.
*
* @param {WorkoutSection} section - Section à afficher.
* @param {number} index - Index de la section dans l'entraînement.
* @param {boolean} [isStarting] - Indique si la section est la première section de l'entraînement.
 */

export function SectionDisplay({
    section,
    index,
    isStarting,
    isExerciseCompleted,
    toggleExercise,
    isCurrentSection,
    onSectionStart
}: SectionDisplayProps) {

    const icon = sectionIcons[section.type] || '📋'

    // Déterminer quel timer afficher selon le type
    const renderTimer = () => {
        if (section.type === 'amrap' && section.duration_min) {
            return <AMRAPTimer durationMin={section.duration_min} />
        }
        if (section.type === 'for_time') {
            return <ForTimeTimer capMin={section.duration_min} />
        }
        if (section.type === 'emom' && section.duration_min) {
            return <EMOMTimer durationMin={section.duration_min} />
        }
        if (section.type === 'tabata') {
            return <TabataTimer rounds={section.rounds} />
        }
        return null
    }


    return (
        <div className={`bg-card border rounded-lg p-4 space-y-3 ${isCurrentSection ? 'ring-2 ring-primary' : ''}`}>
            {/* Header de la section */}
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span>{icon}</span>
                        <span>{section.title}</span>
                    </h3>
                    {section.description && (
                        <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {section.duration_min && (
                        <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                            {section.duration_min} min
                        </span>
                    )}
                </div>
            </div>

            {/* Timer de section spécialisé selon le type */}
            {isStarting && renderTimer()}

            {/* Format et détails */}
            {section.format && (
                <div className="text-sm px-3 py-2 bg-muted/50 rounded">
                    <strong>Format:</strong> {section.format}
                </div>
            )}

            {section.goal && (
                <div className="text-sm text-muted-foreground">
                    <strong>Objectif:</strong> {section.goal}
                </div>
            )}

            {section.focus && (
                <div className="text-sm text-muted-foreground">
                    <strong>Focus:</strong> {section.focus}
                </div>
            )}

            {/* Rounds et repos */}
            {(section.rounds || section.rest_between_rounds) && (
                <div className="flex gap-4 text-sm">
                    {section.rounds && (
                        <span className="text-muted-foreground">
                            <strong>Rounds:</strong> {section.rounds}
                        </span>
                    )}
                    {section.rest_between_rounds && (
                        <span className="text-muted-foreground">
                            <strong>Repos entre rounds:</strong> {section.rest_between_rounds}s
                        </span>
                    )}
                </div>
            )}

            {/* Exercices avec checkboxes */}
            {section.exercises && section.exercises.length > 0 && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                    {section.exercises.map((exercise, exIdx) => (
                        <ExerciseDisplay
                            key={exIdx}
                            exercise={exercise}
                            isStarting={isStarting || false}
                            isCompleted={isExerciseCompleted ? isExerciseCompleted(index, exIdx) : false}
                            onToggle={toggleExercise ? () => toggleExercise(index, exIdx) : undefined}
                        />
                    ))}
                </div>
            )}

            {/* Intervalles */}
            {section.intervals && (
                <div className="bg-muted/30 rounded p-3 space-y-2">
                    <div className="text-sm">
                        <strong>Travail:</strong>
                        {section.intervals.work.distance && ` ${section.intervals.work.distance}`}
                        {section.intervals.work.duration && ` ${section.intervals.work.duration}`}
                        {section.intervals.work.pace && ` @ ${section.intervals.work.pace}`}
                        {section.intervals.work.effort && ` (${section.intervals.work.effort})`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        <strong>Repos:</strong> {section.intervals.rest.duration}
                        {section.intervals.rest.type && ` (${section.intervals.rest.type})`}
                    </div>
                    {section.rounds && (
                        <div className="text-sm font-medium">× {section.rounds} répétitions</div>
                    )}
                </div>
            )}

            {/* Sections imbriquées */}
            {section.sections && section.sections.length > 0 && (
                <div className="space-y-3 pl-4">
                    {section.sections.map((subsection, subIdx) => (
                        <SectionDisplay
                            key={subIdx}
                            section={subsection}
                            index={index}
                            isExerciseCompleted={isExerciseCompleted}
                            toggleExercise={toggleExercise}
                            isCurrentSection={false}
                            onSectionStart={onSectionStart}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

