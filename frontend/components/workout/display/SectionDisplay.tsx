import { WorkoutSection } from '@/domain/entities/workout-structure'
import { Check, Play, X } from 'lucide-react'
import { AMRAPTimer } from '@/app/timer/timers/AMRAPTimer'
import { EMOMTimer } from '@/app/timer/timers/EMOMTimer'
import { ForTimeTimer } from '@/app/timer/timers/ForTimeTimer'
import { TabataTimer } from '@/app/timer/timers/TabataTimer'
import { ExerciseDisplay } from './ExerciseDisplay'
import { ExerciseSlider } from './ExerciseSlider'
import { sectionIcons } from './SectionIcons'
import { useState } from 'react'

interface SectionDisplayProps {
    section: WorkoutSection
    index: number
    isStarting?: boolean
    isSectionCompleted?: boolean
    onSectionToggle?: () => void
    isCurrentSection?: boolean
    onSectionStart?: () => void
    onExerciseClick?: (exerciseId: string) => void
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
    isSectionCompleted,
    onSectionToggle,
    isCurrentSection,
    onSectionStart,
    onExerciseClick
}: SectionDisplayProps) {

    const icon = sectionIcons[section.type] || '📋'
    const [isActiveMode, setIsActiveMode] = useState(false)

    const handleStartSection = () => {
        setIsActiveMode(true)
        onSectionStart?.()
    }

    const handleCloseActiveMode = () => {
        setIsActiveMode(false)
    }

    const handleAllExercisesCompleted = () => {
        // Marquer la section comme complétée
        onSectionToggle?.()
        // Fermer le mode actif après un délai
        setTimeout(() => {
            setIsActiveMode(false)
        }, 1000)
    }

    // Déterminer quel timer afficher selon le type OU le format
    const renderTimer = () => {
        // Détection AMRAP par type ou format
        if ((section.type === 'amrap' || section.format?.toLowerCase().includes('amrap')) && section.duration_min) {
            return <AMRAPTimer duration={section.duration_min} />
        }
        // Détection For Time par type ou format
        if (section.type === 'for_time' || section.format?.toLowerCase().includes('for time')) {
            return <ForTimeTimer capMin={section.duration_min} />
        }
        // Détection EMOM par type ou format
        if ((section.type === 'emom' || section.format?.toLowerCase().includes('emom')) && section.duration_min) {
            return <EMOMTimer durationMin={section.duration_min} intervalMin={1} />
        }
        // Détection Tabata par type ou format
        if (section.type === 'tabata' || section.format?.toLowerCase().includes('tabata')) {
            return <TabataTimer rounds={section.rounds} workSeconds={20} restSeconds={10} />
        }
        return null
    }


    // Mode actif : affichage plein écran des exercices uniquement
    if (isActiveMode && section.exercises && section.exercises.length > 0) {
        // Détection AMRAP par type ou format
        const isAMRAP = section.type === 'amrap' || section.format?.toLowerCase().includes('amrap')

        return (
            <div className="fixed inset-0 z-50 bg-background overflow-auto">
                <div className="min-h-screen p-4 pb-20">
                    {/* Header avec bouton fermer */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{icon}</span>
                            <h2 className="text-xl font-bold">{section.title}</h2>
                        </div>
                        <button
                            onClick={handleCloseActiveMode}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Description si présente */}
                    {section.description && (
                        <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                    )}

                    {/* Timer de section - compact pour AMRAP */}
                    {isAMRAP ? (
                        <div className="mb-4">
                            {renderTimer()}
                        </div>
                    ) : (
                        renderTimer()
                    )}

                    {/* Pour AMRAP: liste d'exercices sans checkboxes, sinon slider */}
                    <div className="mt-4">
                        {isAMRAP ? (
                            <>
                                <div className="space-y-3">
                                    {section.exercises.map((exercise, idx) => (
                                        <ExerciseDisplay
                                            key={idx}
                                            exercise={exercise}
                                            isStarting={false}
                                            isCompleted={false}
                                            onExerciseClick={onExerciseClick}
                                        />
                                    ))}
                                </div>
                                {/* Bouton Terminé pour AMRAP */}
                                <button
                                    onClick={handleAllExercisesCompleted}
                                    className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold text-base"
                                >
                                    <Check className="w-5 h-5" />
                                    <span>Terminer la section</span>
                                </button>
                            </>
                        ) : (
                            <ExerciseSlider
                                exercises={section.exercises}
                                rounds={section.rounds}
                                onExerciseClick={onExerciseClick}
                                onAllExercisesCompleted={handleAllExercisesCompleted}
                            />
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`bg-card border rounded-lg p-4 space-y-3 ${isCurrentSection ? 'ring-2 ring-primary' : ''} ${isSectionCompleted ? 'opacity-60' : ''}`}>
            {/* Header de la section */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span>{icon}</span>
                            <span>{section.title}</span>
                            {isSectionCompleted && (
                                <span className="ml-2 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Terminé
                                </span>
                            )}
                        </h3>
                        {section.description && (
                            <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {section.duration_min && (
                        <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                            {section.duration_min} min
                        </span>
                    )}
                </div>
            </div>

            {/* Timer de section désactivé - uniquement en mode actif */}

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
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                    <div className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                        📋 Instructions
                    </div>
                    <div className="text-amber-800 dark:text-amber-200">
                        {section.rounds === 1 ? (
                            <>Réalise 1 tour complet des exercices ci-dessous</>
                        ) : section.rounds ? (
                            <>Répète {section.rounds} fois la série d'exercices ci-dessous</>
                        ) : null}
                        {section.rest_between_rounds && section.rounds && section.rounds > 1 && (
                            <> avec {section.rest_between_rounds}s de repos entre chaque tour</>
                        )}
                        .
                    </div>
                </div>
            )}

            {/* Exercices - Affichage liste */}
            {section.exercises && section.exercises.length > 0 && (
                <div className="space-y-3">
                    {/* Liste des exercices */}
                    <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                        {section.exercises.map((exercise, exIdx) => (
                            <ExerciseDisplay
                                key={exIdx}
                                exercise={exercise}
                                isStarting={false}
                                isCompleted={false}
                                rounds={section.rounds}
                                onExerciseClick={onExerciseClick}
                            />
                        ))}
                    </div>

                    {/* Bouton Démarrer compact en bas */}
                    {isStarting && !isSectionCompleted && (
                        <button
                            onClick={handleStartSection}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-md"
                        >
                            <Play className="w-4 h-4" />
                            <span>Démarrer</span>
                        </button>
                    )}
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

