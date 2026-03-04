'use client'

import type { GeneratedProgram } from '@/domain/entities/training-program'
import { trainingProgramsService, type GenerateProgramRequest } from '@/services/training-programs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const DEFAULT_FORM: GenerateProgramRequest = {
  program_type: 'strength_building',
  duration_weeks: 8,
  sessions_per_week: 3,
  target_level: 'intermediate',
  focus: '',
  box_days_per_week: 2,
}

export function useProgramGenerator() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<GenerateProgramRequest>(DEFAULT_FORM)
  const [generatedProgram, setGeneratedProgram] = useState<GeneratedProgram | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const program = await trainingProgramsService.generateWithAI(formData)
      setGeneratedProgram(program)
      setStep(2)
    } catch {
      toast.error("Échec de la génération du programme. Réessayez.")
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedProgram) return
    setSaving(true)
    try {
      await trainingProgramsService.createAndEnroll({
        ...formData,
        name: generatedProgram.name,
        description: generatedProgram.description,
        objectives: generatedProgram.objectives,
        weekly_structure: generatedProgram,
        progression_notes: generatedProgram.progression_notes,
      })
      toast.success('Programme créé et démarré !')
      router.push('/training-programs')
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || ''
      if (msg.includes('actif')) {
        toast.error('Un programme est déjà actif. Abandonnez-le avant d\'en créer un nouveau.')
      } else {
        toast.error('Impossible de sauvegarder le programme')
      }
    } finally {
      setSaving(false)
    }
  }

  const updateField = <K extends keyof GenerateProgramRequest>(key: K, value: GenerateProgramRequest[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  return {
    step,
    setStep,
    formData,
    updateField,
    generating,
    saving,
    generatedProgram,
    handleGenerate,
    handleSave,
  }
}
