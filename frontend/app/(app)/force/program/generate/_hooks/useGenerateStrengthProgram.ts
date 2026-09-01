import { GeneratedProgram, GenerateStrengthProgramDto, strengthProgramApi } from '@/services/strength-program'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export function useGenerateStrengthProgram() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'preview'>('form')

  // Form state
  const [trainingStyle, setTrainingStyle] = useState<NonNullable<GenerateStrengthProgramDto['training_style']>>('force_max')
  const [duration, setDuration] = useState<GenerateStrengthProgramDto['duration_weeks']>(8)
  const [sessions, setSessions] = useState<GenerateStrengthProgramDto['sessions_per_week']>(3)
  const [focus, setFocus] = useState('')

  // Preview state
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<GeneratedProgram | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<number>(0)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await strengthProgramApi.generatePreview({
        training_style: trainingStyle,
        duration_weeks: duration,
        sessions_per_week: sessions,
        focus: focus || undefined,
      })
      setPreview(result)
      setStep('preview')
    } catch {
      toast.error('Erreur lors de la génération du programme')
    } finally {
      setGenerating(false)
    }
  }

  const handleConfirm = async () => {
    if (!preview) return
    setSaving(true)
    try {
      await strengthProgramApi.createAndEnroll({
        ...preview,
        duration_weeks: duration,
        sessions_per_week: sessions,
      })
      toast.success('Programme créé !')
      router.push('/force/program')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('actif')) {
        toast.error('Tu as déjà un programme actif. Abandonne-le avant d\'en créer un nouveau.')
      } else {
        toast.error('Erreur lors de la sauvegarde')
      }
    } finally {
      setSaving(false)
    }
  }

  return {
    router,
    step,
    setStep,
    trainingStyle,
    setTrainingStyle,
    duration,
    setDuration,
    sessions,
    setSessions,
    focus,
    setFocus,
    generating,
    saving,
    preview,
    expandedPhase,
    setExpandedPhase,
    handleGenerate,
    handleConfirm,
  }
}
