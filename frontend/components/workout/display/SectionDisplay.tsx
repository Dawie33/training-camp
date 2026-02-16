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
    canStart?: boolean
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
    onExerciseClick,
    canStart = true
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
        // Détection EMOM par type ou format (EMOM, E2MOM, E3MOM, etc.)
        if ((section.type === 'emom' || section.format?.toLowerCase().includes('emom')) && section.duration_min) {
            // Extraire l'intervalle (E2MOM = 2 min, E3MOM = 3 min, sinon 1 min par défaut)
            const formatLower = section.format?.toLowerCase() || ''
            const intervalMatch = formatLower.match(/e(\d+)mom/)
            const intervalMin = intervalMatch ? parseInt(intervalMatch[1]) : 1
            return <EMOMTimer durationMin={section.duration_min} intervalMin={intervalMin} />
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
            <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-auto">
                <div className="min-h-screen p-4 pb-20">
                    {/* Header avec bouton fermer */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold">{section.title}</h2>
                        </div>
                        <button
                            onClick={handleCloseActiveMode}
                            className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Description si présente */}
                    {section.description && (
                        <p className="text-sm text-slate-400 mb-4">{section.description}</p>
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
                                    className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-semibold text-base shadow-lg shadow-green-500/30"
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
        <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl lg:rounded-2xl p-4 lg:p-6 space-y-3 lg:space-y-4 ${isCurrentSection ? 'ring-2 ring-orange-500/50' : ''} ${isSectionCompleted ? 'opacity-60' : ''}`}>
            {/* Header de la section */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    <div className="flex-1">
                        <h3 className="text-base lg:text-lg font-semibold flex items-center gap-2">
                            <span>{section.title}</span>
                            {isSectionCompleted && (
                                <span className="ml-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Terminé
                                </span>
                            )}
                        </h3>
                        {section.description && (
                            <p className="text-sm text-slate-400 mt-1">{section.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {section.duration_min && (
                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs lg:text-sm font-semibold">
                            {section.duration_min} min
                        </span>
                    )}
                </div>
            </div>

            {/* Format et détails */}
            {section.format && (
                <div className="text-sm px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 font-medium">Format:</span> <span className="text-slate-300">{section.format}</span>
                </div>
            )}

            {section.goal && (
                <div className="text-sm text-slate-400">
                    <span className="text-slate-300 font-medium">Objectif:</span> {section.goal}
                </div>
            )}

            {section.focus && (
                <div className="text-sm text-slate-400">
                    <span className="text-slate-300 font-medium">Focus:</span> {section.focus}
                </div>
            )}

            {/* Rounds et repos */}
            {(section.rounds || section.rest_between_rounds) && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm">
                    <div className="font-medium text-amber-400 mb-1">
                        Instructions
                    </div>
                    <div className="text-amber-300">
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
                    <div className="space-y-2 pl-4 border-l-2 border-orange-500/30">
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
                        <div className="space-y-2">
                            <button
                                onClick={handleStartSection}
                                disabled={!canStart}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium shadow-md ${
                                    canStart
                                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/30'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                }`}
                            >
                                <Play className="w-4 h-4" />
                                <span>Démarrer</span>
                            </button>
                            {!canStart && (
                                <p className="text-xs text-slate-500 text-center">
                                    Terminez la section précédente pour débloquer
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Intervalles */}
            {section.intervals && (
                <div className="bg-slate-900/50 rounded-xl p-3 space-y-2 border border-slate-700/50">
                    <div className="text-sm text-slate-300">
                        <span className="font-medium">Travail:</span>
                        {section.intervals.work.distance && ` ${section.intervals.work.distance}`}
                        {section.intervals.work.duration && ` ${section.intervals.work.duration}`}
                        {section.intervals.work.pace && ` @ ${section.intervals.work.pace}`}
                        {section.intervals.work.effort && ` (${section.intervals.work.effort})`}
                    </div>
                    <div className="text-sm text-slate-400">
                        <span className="font-medium">Repos:</span> {section.intervals.rest.duration}
                        {section.intervals.rest.type && ` (${section.intervals.rest.type})`}
                    </div>
                    {section.rounds && (
                        <div className="text-sm font-medium text-orange-400">x {section.rounds} répétitions</div>
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

