'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { Exercise as ExerciseType } from '@/domain/entities/exercise'
import type { Exercise, WorkoutBlocks, WorkoutSection } from '@/domain/entities/workout-structure'
import { useId, useRef, useState } from 'react'
import { ExercisesSidebar } from './ExercisesSidebar'

interface BlocksEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

const SECTION_TYPES = [
  { value: 'skill_work', label: 'Skill Work' },
  { value: 'strength', label: 'Strength' },
  { value: 'metcon', label: 'MetCon' },
  { value: 'amrap', label: 'AMRAP' },
  { value: 'emom', label: 'EMOM' },
  { value: 'for_time', label: 'For Time' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'intervals', label: 'Intervals' },
  { value: 'circuit', label: 'Circuit' },
  { value: 'tabata', label: 'Tabata' },
  { value: 'finisher', label: 'Finisher' },
  { value: 'core', label: 'Core' },
  { value: 'accessory', label: 'Accessory' },
]

const TIMECAP_TYPES = ['for_time', 'amrap', 'emom']

/**
 * Éditeur visuel de la structure JSON d'un workout (`blocks`) : sections, métadonnées
 * (type, durée, rounds, repos) et exercices, avec ajout depuis la bibliothèque
 * d'exercices (`ExercisesSidebar`).
 */
export function BlocksEditor({ value, onChange, label }: BlocksEditorProps) {
  const formId = useId()
  const libraryTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null)

  const parseBlocks = (): WorkoutBlocks => {
    if (!value.trim()) {
      return { sections: [] }
    }
    try {
      return JSON.parse(value) as WorkoutBlocks
    } catch {
      return { sections: [] }
    }
  }

  const blocks = parseBlocks()

  const updateBlocks = (newBlocks: WorkoutBlocks) => {
    onChange(JSON.stringify(newBlocks, null, 2))
  }

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  const addSection = () => {
    const newSection: WorkoutSection = {
      type: 'metcon',
      title: 'Nouvelle Section',
      exercises: [],
    }
    updateBlocks({
      ...blocks,
      sections: [...blocks.sections, newSection],
    })
    setExpandedSections(new Set([...expandedSections, blocks.sections.length]))
  }

  const removeSection = (index: number) => {
    const newSections = blocks.sections.filter((_, i) => i !== index)
    updateBlocks({ ...blocks, sections: newSections })
  }

  const updateSection = (index: number, updatedSection: Partial<WorkoutSection>) => {
    const newSections = [...blocks.sections]
    newSections[index] = { ...newSections[index], ...updatedSection }
    updateBlocks({ ...blocks, sections: newSections })
  }

  const addExercise = (sectionIndex: number) => {
    const section = blocks.sections[sectionIndex]
    const newExercise: Exercise = {
      name: '',
      reps: '',
      sets: 1,
    }
    updateSection(sectionIndex, {
      exercises: [...(section.exercises || []), newExercise],
    })
  }

  const removeExercise = (sectionIndex: number, exerciseIndex: number) => {
    const section = blocks.sections[sectionIndex]
    const newExercises = (section.exercises || []).filter((_, i) => i !== exerciseIndex)
    updateSection(sectionIndex, { exercises: newExercises })
  }

  const updateExercise = (sectionIndex: number, exerciseIndex: number, updatedExercise: Partial<Exercise>) => {
    const section = blocks.sections[sectionIndex]
    const newExercises = [...(section.exercises || [])]
    newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], ...updatedExercise }
    updateSection(sectionIndex, { exercises: newExercises })
  }

  const addExerciseFromLibrary = (exercise: ExerciseType) => {
    if (activeSectionIndex === null) return

    const newExercise: Exercise = {
      name: exercise.name,
      reps: exercise.measurement_type === 'reps' ? '10' : '',
      sets: 3,
      details: exercise.description || '',
    }

    const section = blocks.sections[activeSectionIndex]
    updateSection(activeSectionIndex, {
      exercises: [...(section.exercises || []), newExercise],
    })
  }

  const openExerciseLibrary = (sectionIndex: number, trigger: HTMLButtonElement) => {
    libraryTriggerRef.current = trigger
    setActiveSectionIndex(sectionIndex)
    setSidebarOpen(true)
  }

  return (
    <div className="space-y-4">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}

      {/* Stimulus / Objectif */}
      <div>
        <label htmlFor={`${formId}-0`} className="text-xs font-medium text-muted-foreground block mb-1">Stimulus / Objectif du WOD</label>
        <Textarea id={`${formId}-0`}
          className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all resize-none text-sm"
          value={blocks.stimulus || ''}
          onChange={(e) => updateBlocks({ ...blocks, stimulus: e.target.value || undefined })}
          placeholder="High intensity metabolic conditioning..."
          rows={2}
        />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {blocks.sections.map((section, sectionIndex) => {
          const isExpanded = expandedSections.has(sectionIndex)
          const hasTimecap = TIMECAP_TYPES.includes(section.type)
          const hasTimeAttack = section.type === 'for_time'

          return (
            <div key={sectionIndex} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Section header */}
              <div
                className="flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors"
              >
                <Button type="button" variant="ghost" aria-expanded={isExpanded}
                  onClick={() => toggleSection(sectionIndex)}
                  className="h-auto whitespace-normal justify-start text-left flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-muted-foreground cursor-move">≡</span>
                  <span>
                    <span className="text-sm font-semibold text-foreground">
                      {section.title || `Section ${sectionIndex + 1}`}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {section.type} {section.exercises && `· ${section.exercises.length} exercices`}
                    </span>
                  </span>
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost"
                    type="button"
                    aria-label={`Supprimer la section ${section.title || sectionIndex + 1}`}
                    onClick={(e) => { e.stopPropagation(); removeSection(sectionIndex) }}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    ×
                  </Button>
                  <span className="text-muted-foreground text-sm">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                  {/* Section metadata */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`${formId}-1-${sectionIndex}`} className="text-xs font-medium text-muted-foreground block mb-1">Type</label>
                      <select id={`${formId}-1-${sectionIndex}`}
                        className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                        value={section.type}
                        onChange={(e) => updateSection(sectionIndex, { type: e.target.value as WorkoutSection['type'] })}
                      >
                        {SECTION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`${formId}-2-${sectionIndex}`} className="text-xs font-medium text-muted-foreground block mb-1">Titre</label>
                      <Input id={`${formId}-2-${sectionIndex}`}
                        type="text"
                        className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                        value={section.title}
                        onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                        placeholder="Ex: MetCon"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor={`${formId}-3-${sectionIndex}`} className="text-xs font-medium text-muted-foreground block mb-1">
                        {hasTimecap ? 'TimeCap (min)' : 'Durée (min)'}
                      </label>

                      <Input id={`${formId}-3-${sectionIndex}`}
                        type="number"
                        className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                        value={section.duration_min || ''}
                        onChange={(e) => updateSection(sectionIndex, { duration_min: Number(e.target.value) || undefined })}
                        placeholder='ex: 20min'
                      />
                    </div>

                    <div>
                      <label htmlFor={`${formId}-4-${sectionIndex}`} className="text-xs font-medium text-muted-foreground block mb-1">
                        {hasTimeAttack ? 'TimeAttack (max)' : 'Durée max)'}
                      </label>

                      <Input id={`${formId}-4-${sectionIndex}`}
                        type="number"
                        className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                        value={section.duration_max || ''}
                        onChange={(e) => updateSection(sectionIndex, { duration_max: Number(e.target.value) || undefined })}
                        placeholder='ex: 20min'
                      />
                    </div>

                    <div>
                      <label htmlFor={`${formId}-5-${sectionIndex}`} className="text-xs font-medium text-muted-foreground block mb-1">Rounds</label>
                      <Input id={`${formId}-5-${sectionIndex}`}
                        type="number"
                        className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                        value={section.rounds || ''}
                        onChange={(e) => updateSection(sectionIndex, { rounds: Number(e.target.value) || undefined })}
                      />
                    </div>
                    <div>
                      <label htmlFor={`${formId}-6-${sectionIndex}`} className="text-xs font-medium text-muted-foreground block mb-1">Repos (sec)</label>
                      <Input id={`${formId}-6-${sectionIndex}`}
                        type="number"
                        className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                        value={section.rest_between_rounds || ''}
                        onChange={(e) => updateSection(sectionIndex, { rest_between_rounds: Number(e.target.value) || undefined })}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`${formId}-7-${sectionIndex}`} className="text-xs font-medium text-muted-foreground block mb-1">Tâche après chaque round</label>
                    <Input id={`${formId}-7-${sectionIndex}`}
                      type="text"
                      className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                      value={section.between_rounds_task || ''}
                      onChange={(e) => updateSection(sectionIndex, { between_rounds_task: e.target.value || undefined })}
                      placeholder="ex: 30 Double-Unders"
                    />
                  </div>

                  <div>
                    <label htmlFor={`${formId}-8-${sectionIndex}`} className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                    <Textarea id={`${formId}-8-${sectionIndex}`}
                      className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all resize-none"
                      value={section.description || ''}
                      onChange={(e) => updateSection(sectionIndex, { description: e.target.value || undefined })}
                      rows={2}
                      placeholder="Description de la section..."
                    />
                  </div>

                  {/* Exercises */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">Exercices</label>
                    </div>

                    {(section.exercises || []).map((exercise, exerciseIndex) => (

                      <div key={exerciseIndex} className="bg-background border border-border rounded-xl p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground mt-2 cursor-move text-sm">≡</span>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div>
                              <label htmlFor={`${formId}-9-${sectionIndex}-${exerciseIndex}`} className="text-xs font-medium text-muted-foreground">Nom</label>
                              <Input id={`${formId}-9-${sectionIndex}-${exerciseIndex}`}
                                type="text"
                                className="w-full px-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all font-medium"
                                value={exercise.name}
                                onChange={(e) => updateExercise(sectionIndex, exerciseIndex, { name: e.target.value })}
                                placeholder="Ex: Push-ups, Squats..."
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                              <div>
                                <label htmlFor={`${formId}-10-${sectionIndex}-${exerciseIndex}`} className="text-xs font-medium text-muted-foreground">Reps</label>
                                <Input id={`${formId}-10-${sectionIndex}-${exerciseIndex}`}
                                  type="text"
                                  className="w-full px-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                                  value={exercise.reps || ''}
                                  onChange={(e) => updateExercise(sectionIndex, exerciseIndex, { reps: e.target.value })}
                                  placeholder="10, 10-12..."
                                />
                              </div>
                              <div>
                                <label htmlFor={`${formId}-11-${sectionIndex}-${exerciseIndex}`} className="text-xs font-medium text-muted-foreground">Séries</label>
                                <Input id={`${formId}-11-${sectionIndex}-${exerciseIndex}`}
                                  type="number"
                                  className="w-full px-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                                  value={exercise.sets || ''}
                                  onChange={(e) => updateExercise(sectionIndex, exerciseIndex, { sets: Number(e.target.value) || undefined })}
                                  placeholder="3"
                                />
                              </div>
                              <div>
                                <label htmlFor={`${formId}-12-${sectionIndex}-${exerciseIndex}`} className="text-xs font-medium text-muted-foreground">Poids</label>
                                <Input id={`${formId}-12-${sectionIndex}-${exerciseIndex}`}
                                  type="text"
                                  className="w-full px-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                                  value={exercise.weight || ''}
                                  onChange={(e) => updateExercise(sectionIndex, exerciseIndex, { weight: e.target.value })}
                                  placeholder="20kg, BW..."
                                />
                              </div>
                              <div>
                                <label htmlFor={`${formId}-13-${sectionIndex}-${exerciseIndex}`} className="text-xs font-medium text-muted-foreground">Distance</label>
                                <Input id={`${formId}-13-${sectionIndex}-${exerciseIndex}`}
                                  type="text"
                                  className="w-full px-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                                  value={exercise.distance || ''}
                                  onChange={(e) => updateExercise(sectionIndex, exerciseIndex, { distance: e.target.value })}
                                  placeholder="50m, 400m..."
                                />
                              </div>
                              <div>
                                <label htmlFor={`${formId}-14-${sectionIndex}-${exerciseIndex}`} className="text-xs font-medium text-muted-foreground">Durée</label>
                                <Input id={`${formId}-14-${sectionIndex}-${exerciseIndex}`}
                                  type="text"
                                  className="w-full px-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                                  value={exercise.duration || ''}
                                  onChange={(e) => updateExercise(sectionIndex, exerciseIndex, { duration: e.target.value })}
                                  placeholder="30s, 1min..."
                                />
                              </div>
                            </div>
                            <div>
                              <label htmlFor={`${formId}-15-${sectionIndex}-${exerciseIndex}`} className="text-xs font-medium text-muted-foreground">Détails</label>
                              <Input id={`${formId}-15-${sectionIndex}-${exerciseIndex}`}
                                type="text"
                                className="w-full px-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                                value={exercise.details || ''}
                                onChange={(e) => updateExercise(sectionIndex, exerciseIndex, { details: e.target.value })}
                                placeholder="Notes, tempo, consignes..."
                              />
                            </div>
                          </div>
                          <Button variant="ghost"
                            type="button"
                            aria-label={`Supprimer l'exercice ${exercise.name || exerciseIndex + 1}`}
                            onClick={() => removeExercise(sectionIndex, exerciseIndex)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors mt-1"
                          >
                            ×
                          </Button>
                        </div>

                      </div>

                    ))}
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost"
                        type="button"
                        onClick={(event) => openExerciseLibrary(sectionIndex, event.currentTarget)}
                        className="px-3 py-1.5 text-xs font-medium bg-card border border-border text-foreground rounded-lg hover:bg-card transition-all"
                      >
                        📚 Bibliothèque
                      </Button>
                      <Button variant="ghost"
                        type="button"
                        onClick={() => addExercise(sectionIndex)}
                        className="px-3 py-1.5 text-xs font-medium bg-primary/10 border border-primary/30 text-primary rounded-lg hover:bg-primary/20 transition-all"
                      >
                        + Ajouter
                      </Button>
                    </div>
                    {(!section.exercises || section.exercises.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
                        Aucun exercice. Clique sur &quot;+ Ajouter&quot; pour commencer.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add section button */}
      <Button variant="ghost"
        type="button"
        onClick={addSection}
        className="w-full py-3 px-4 bg-card border border-dashed border-border text-muted-foreground font-medium rounded-xl hover:bg-secondary hover:text-foreground transition-all"
      >
        + Ajouter une section
      </Button>

      {blocks.sections.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-xl">
          Aucune section. Clique sur &quot;+ Ajouter une section&quot; pour construire ton WOD.
        </p>
      )}

      {/* Exercises Sidebar */}
      <ExercisesSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onRestoreFocus={() => libraryTriggerRef.current?.focus()}
        onAddExercise={addExerciseFromLibrary}
      />
    </div>
  )
}
