'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { WorkoutBlocks, WorkoutSection, Exercise } from '@/lib/types/workout-structure'
import type { Exercise as ExerciseType } from '@/lib/types/exercice'
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical, Library } from 'lucide-react'
import { useState } from 'react'
import { ExercisesSidebar } from './ExercisesSidebar'

interface BlocksEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

const SECTION_TYPES = [
  { value: 'warmup', label: 'Warmup' },
  { value: 'skill_work', label: 'Skill Work' },
  { value: 'strength', label: 'Strength' },
  { value: 'metcon', label: 'MetCon' },
  { value: 'amrap', label: 'AMRAP' },
  { value: 'emom', label: 'EMOM' },
  { value: 'for_time', label: 'For Time' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'intervals', label: 'Intervals' },
  { value: 'cooldown', label: 'Cooldown' },
  { value: 'circuit', label: 'Circuit' },
  { value: 'tabata', label: 'Tabata' },
]

export function BlocksEditor({ value, onChange, label }: BlocksEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null)

  // Parse blocks from JSON string
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

  // Update blocks
  const updateBlocks = (newBlocks: WorkoutBlocks) => {
    onChange(JSON.stringify(newBlocks, null, 2))
  }

  // Toggle section expansion
  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  // Add new section
  const addSection = () => {
    const newSection: WorkoutSection = {
      type: 'warmup',
      title: 'Nouvelle Section',
      exercises: [],
    }
    updateBlocks({
      ...blocks,
      sections: [...blocks.sections, newSection],
    })
    setExpandedSections(new Set([...expandedSections, blocks.sections.length]))
  }

  // Remove section
  const removeSection = (index: number) => {
    const newSections = blocks.sections.filter((_, i) => i !== index)
    updateBlocks({ ...blocks, sections: newSections })
  }

  // Update section
  const updateSection = (index: number, updatedSection: Partial<WorkoutSection>) => {
    const newSections = [...blocks.sections]
    newSections[index] = { ...newSections[index], ...updatedSection }
    updateBlocks({ ...blocks, sections: newSections })
  }

  // Add exercise to section
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

  // Remove exercise
  const removeExercise = (sectionIndex: number, exerciseIndex: number) => {
    const section = blocks.sections[sectionIndex]
    const newExercises = (section.exercises || []).filter((_, i) => i !== exerciseIndex)
    updateSection(sectionIndex, { exercises: newExercises })
  }

  // Update exercise
  const updateExercise = (sectionIndex: number, exerciseIndex: number, updatedExercise: Partial<Exercise>) => {
    const section = blocks.sections[sectionIndex]
    const newExercises = [...(section.exercises || [])]
    newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], ...updatedExercise }
    updateSection(sectionIndex, { exercises: newExercises })
  }

  // Add exercise from library
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

  // Open sidebar for a specific section
  const openExerciseLibrary = (sectionIndex: number) => {
    setActiveSectionIndex(sectionIndex)
    setSidebarOpen(true)
  }

  return (
    <div className="space-y-4">
      {label && <label className="text-sm font-medium">{label}</label>}

      {/* Global metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Durée estimée (min)</label>
              <Input
                type="number"
                value={blocks.duration_min || ''}
                onChange={(e) => updateBlocks({ ...blocks, duration_min: Number(e.target.value) || undefined })}
                placeholder="45"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Calories estimées</label>
              <Input
                value={blocks.estimated_calories || ''}
                onChange={(e) => updateBlocks({ ...blocks, estimated_calories: e.target.value || undefined })}
                placeholder="400-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Stimulus / Objectif</label>
            <Textarea
              value={blocks.stimulus || ''}
              onChange={(e) => updateBlocks({ ...blocks, stimulus: e.target.value || undefined })}
              placeholder="High intensity metabolic conditioning..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-3">
        {blocks.sections.map((section, sectionIndex) => {
          const isExpanded = expandedSections.has(sectionIndex)

          return (
            <Card key={sectionIndex} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium">
                        {section.title || `Section ${sectionIndex + 1}`}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {section.type} {section.exercises && `• ${section.exercises.length} exercices`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection(sectionIndex)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(sectionIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4 pt-0">
                  {/* Section metadata */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium">Type</label>
                      <select
                        className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
                        value={section.type}
                        onChange={(e) => updateSection(sectionIndex, { type: e.target.value as any })}
                      >
                        {SECTION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Titre</label>
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                        placeholder="Ex: Warmup"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium">Durée (min)</label>
                      <Input
                        type="number"
                        value={section.duration_min || ''}
                        onChange={(e) => updateSection(sectionIndex, { duration_min: Number(e.target.value) || undefined })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Rounds</label>
                      <Input
                        type="number"
                        value={section.rounds || ''}
                        onChange={(e) => updateSection(sectionIndex, { rounds: Number(e.target.value) || undefined })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Repos (sec)</label>
                      <Input
                        type="number"
                        value={section.rest_between_rounds || ''}
                        onChange={(e) => updateSection(sectionIndex, { rest_between_rounds: Number(e.target.value) || undefined })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium">Description</label>
                    <Textarea
                      value={section.description || ''}
                      onChange={(e) => updateSection(sectionIndex, { description: e.target.value || undefined })}
                      rows={2}
                      placeholder="Description de la section..."
                    />
                  </div>

                  {/* Exercises */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">Exercices</label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openExerciseLibrary(sectionIndex)}
                        >
                          <Library className="h-3 w-3 mr-1" />
                          Bibliothèque
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addExercise(sectionIndex)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Créer
                        </Button>
                      </div>
                    </div>

                    {(section.exercises || []).map((exercise, exerciseIndex) => (
                      <Card key={exerciseIndex} className="bg-muted/50">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-2 cursor-move" />
                            <div className="flex-1 space-y-2">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">Nom de l'exercice</label>
                                <Input
                                  value={exercise.name}
                                  onChange={(e) => updateExercise(sectionIndex, exerciseIndex, { name: e.target.value })}
                                  placeholder="Ex: Push-ups, Squats..."
                                  className="font-medium"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">Répétitions</label>
                                  <Input
                                    value={exercise.reps || ''}
                                    onChange={(e) => updateExercise(sectionIndex, exerciseIndex, { reps: e.target.value })}
                                    placeholder="10, 10-12..."
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">Séries</label>
                                  <Input
                                    type="number"
                                    value={exercise.sets || ''}
                                    onChange={(e) => updateExercise(sectionIndex, exerciseIndex, { sets: Number(e.target.value) || undefined })}
                                    placeholder="3"
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">Poids</label>
                                  <Input
                                    value={exercise.weight || ''}
                                    onChange={(e) => updateExercise(sectionIndex, exerciseIndex, { weight: e.target.value })}
                                    placeholder="20kg, BW..."
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">Détails / Instructions</label>
                                <Input
                                  value={exercise.details || ''}
                                  onChange={(e) => updateExercise(sectionIndex, exerciseIndex, { details: e.target.value })}
                                  placeholder="Notes, tempo, consignes..."
                                  className="text-sm"
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExercise(sectionIndex, exerciseIndex)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {(!section.exercises || section.exercises.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
                        Aucun exercice. Cliquez sur "Ajouter exercice" pour commencer.
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Add section button */}
      <Button
        type="button"
        variant="outline"
        onClick={addSection}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une section
      </Button>

      {blocks.sections.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-md">
          Aucune section. Cliquez sur "Ajouter une section" pour commencer à construire votre workout.
        </p>
      )}

      {/* Exercises Sidebar */}
      <ExercisesSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddExercise={addExerciseFromLibrary}
      />
    </div>
  )
}
