import { trainingProgramsApi, GenerateProgramDto, GeneratedProgram } from '@/services/training-programs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export function useGenerateProgram() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'preview'>('form')

  // Form state
  const [programType, setProgramType] = useState<GenerateProgramDto['program_type']>('strength_building')
  const [duration, setDuration] = useState<GenerateProgramDto['duration_weeks']>(8)
  const [sessions, setSessions] = useState<GenerateProgramDto['sessions_per_week']>(3)
  const [level, setLevel] = useState<GenerateProgramDto['target_level']>('intermediate')
  const [focus, setFocus] = useState('')

  // Preview state
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<GeneratedProgram | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<number>(0)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await trainingProgramsApi.generatePreview({
        program_type: programType,
        duration_weeks: duration,
        sessions_per_week: sessions,
        target_level: level,
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
      await trainingProgramsApi.createAndEnroll({
        ...preview,
        program_type: programType,
        duration_weeks: duration,
        sessions_per_week: sessions,
        target_level: level,
      })
      toast.success('Programme créé !')
      router.push('/training-programs')
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
    programType,
    setProgramType,
    duration,
    setDuration,
    sessions,
    setSessions,
    level,
    setLevel,
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
