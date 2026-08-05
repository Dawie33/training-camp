import {
  deriveBodyFocus,
  GeneratedStrengthSession,
  GenerateStrengthDto,
  MuscleGroup,
  SessionGoal,
  strengthService,
  TrainingStyle,
} from '@/services/strength'
import { usersService } from '@/services/users'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export function useGenerateStrengthSession() {
  const router = useRouter()

  // Formulaire IA
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([])
  const [sessionGoal, setSessionGoal] = useState<SessionGoal>('hypertrophy')
  const bodyFocus = useMemo(() => deriveBodyFocus(selectedMuscles), [selectedMuscles])
  const [trainingStyle, setTrainingStyle] = useState<TrainingStyle>('traditional')
  const [equipment, setEquipment] = useState<string[]>([])
  const [profileEquipment, setProfileEquipment] = useState<string[]>([])
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [additionalContext, setAdditionalContext] = useState('')
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number | undefined>(undefined)
  const [personalized, setPersonalized] = useState(true)

  // Formulaire "Depuis les réseaux"
  const [parseInputText, setParseInputText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  // Résultat partagé par les deux modes
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [plan, setPlan] = useState<GeneratedStrengthSession | null>(null)
  const [lastParams, setLastParams] = useState<GenerateStrengthDto | null>(null)

  useEffect(() => {
    setLoadingProfile(true)
    usersService.getUserProfile()
      .then((user) => setProfileEquipment(user.equipment_available ?? []))
      .catch(() => {})
      .finally(() => setLoadingProfile(false))
  }, [])

  const toggleMuscle = (m: MuscleGroup) =>
    setSelectedMuscles((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])

  const buildParams = (): GenerateStrengthDto => ({
    targetMuscles: selectedMuscles,
    sessionGoal,
    bodyFocus: bodyFocus === 'full_body' ? undefined : bodyFocus,
    trainingStyle,
    availableEquipment: equipment,
    additionalContext: additionalContext || undefined,
    targetDurationMinutes,
    personalized,
  })

  const handleGenerate = async () => {
    if (selectedMuscles.length === 0) {
      toast.error('Sélectionne au moins un groupe musculaire')
      return
    }
    const params = buildParams()
    try {
      setLoading(true)
      setPlan(null)
      setLastParams(params)
      const generatedPlan = await strengthService.generatePreview(params)
      setPlan(generatedPlan)
    } catch { toast.error('Erreur lors de la génération') } finally { setLoading(false) }
  }

  const handleAnalyzeText = async () => {
    if (parseInputText.trim().length < 10) {
      toast.error('Colle un texte plus complet')
      return
    }
    try {
      setAnalyzing(true)
      setPlan(null)
      const result = await strengthService.parseText(parseInputText)
      setPlan(result)
      setLastParams({ targetMuscles: result.target_muscles as MuscleGroup[], sessionGoal: result.session_goal })
    } catch {
      toast.error("Impossible d'analyser ce texte")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!plan || !lastParams) return
    try {
      setSaving(true)
      await strengthService.generateAndSave({ ...lastParams, existingPlan: plan })
      toast.success('Séance sauvegardée !')
      router.push('/force')
    } catch { toast.error('Erreur lors de la sauvegarde') } finally { setSaving(false) }
  }

  const resetPlan = () => {
    setPlan(null)
    setLastParams(null)
  }

  return {
    selectedMuscles, setSelectedMuscles, toggleMuscle,
    sessionGoal, setSessionGoal,
    bodyFocus,
    trainingStyle, setTrainingStyle,
    equipment, setEquipment, profileEquipment, loadingProfile,
    additionalContext, setAdditionalContext,
    targetDurationMinutes, setTargetDurationMinutes,
    personalized, setPersonalized,
    parseInputText, setParseInputText, analyzing,
    loading, saving, plan,
    handleGenerate, handleAnalyzeText, handleSave, resetPlan,
  }
}
