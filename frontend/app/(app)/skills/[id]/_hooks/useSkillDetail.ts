'use client'

import type { Equipment } from '@/domain/entities/equipment'
import type { SkillProgram, SkillProgressLog, SkillStep } from '@/domain/entities/skill'
import type { GeneratedWorkout, Workouts } from '@/domain/entities/workout'
import { getEquipments } from '@/services/equipments'
import { skillsService } from '@/services/skills'
import { usersService } from '@/services/users'
import { workoutsService } from '@/services/workouts'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

export type LogModalState =
  | { isOpen: false }
  | { isOpen: true; stepId: string; data: { value: string; notes: string; date: string }; saving: boolean }

export type WodModalState =
  | { isOpen: false }
  | { isOpen: true; stepContext: SkillStep; generated: GeneratedWorkout | null; generating: boolean; saving: boolean }

export function useSkillDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [program, setProgram] = useState<SkillProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [stepLogs, setStepLogs] = useState<Record<string, SkillProgressLog[]>>({})

  const [logModal, setLogModal] = useState<LogModalState>({ isOpen: false })
  const [wodModal, setWodModal] = useState<WodModalState>({ isOpen: false })
  const [wodIncludeWarmup, setWodIncludeWarmup] = useState(true)
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([])
  const [wodSelectedEquipment, setWodSelectedEquipment] = useState<string[]>([])
  const [equipmentsLoaded, setEquipmentsLoaded] = useState(false)
  const [boxMode, setBoxMode] = useState(false)
  const [userProfileEquipment, setUserProfileEquipment] = useState<string[]>([])

  const [, startTransition] = useTransition()

  const fetchProgram = useCallback(async () => {
    try {
      setLoading(true)
      const data = await skillsService.getOne(id)
      setProgram(data)
      const activeStep = data.steps?.find(s => s.status === 'in_progress')
      if (activeStep) setExpandedStep(activeStep.id)
    } catch {
      toast.error('Erreur lors du chargement du programme')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProgram()
  }, [fetchProgram])

  const fetchStepLogs = async (stepId: string) => {
    if (stepLogs[stepId]) return
    try {
      const logs = await skillsService.getStepLogs(stepId)
      setStepLogs(prev => ({ ...prev, [stepId]: logs }))
    } catch {
      // silently fail
    }
  }

  const handleToggleStep = (stepId: string) => {
    if (expandedStep === stepId) {
      setExpandedStep(null)
    } else {
      setExpandedStep(stepId)
      fetchStepLogs(stepId)
    }
  }

  const handleCompleteStep = (stepId: string) => {
    startTransition(async () => {
      try {
        await skillsService.updateStep(id, stepId, { status: 'completed' })
        toast.success('Etape marquee comme terminee')
        fetchProgram()
      } catch {
        toast.error('Erreur')
      }
    })
  }

  const handleSkipStep = (stepId: string) => {
    startTransition(async () => {
      try {
        await skillsService.updateStep(id, stepId, { status: 'skipped', manually_overridden: true })
        toast.success('Etape passee')
        fetchProgram()
      } catch {
        toast.error('Erreur')
      }
    })
  }

  const handlePauseResume = async () => {
    if (!program) return
    const newStatus = program.status === 'paused' ? 'active' : 'paused'
    try {
      await skillsService.updateProgram(id, { status: newStatus })
      toast.success(newStatus === 'paused' ? 'Programme mis en pause' : 'Programme repris')
      fetchProgram()
    } catch {
      toast.error('Erreur')
    }
  }

  const handleAbandon = async () => {
    try {
      await skillsService.updateProgram(id, { status: 'abandoned' })
      toast.success('Programme abandonne')
      fetchProgram()
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce programme ? Cette action est irreversible.')) return
    try {
      await skillsService.deleteProgram(id)
      toast.success('Programme supprime')
      router.push('/skills')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const openLogModal = (stepId: string) => {
    setLogModal({ isOpen: true, stepId, data: { value: '', notes: '', date: new Date().toISOString().split('T')[0] }, saving: false })
  }

  const handleSaveLog = async () => {
    if (!logModal.isOpen) return
    const { stepId, data } = logModal
    try {
      setLogModal(prev => prev.isOpen ? { ...prev, saving: true } : prev)
      const step = program?.steps?.find(s => s.id === stepId)
      const performanceData: Record<string, unknown> = {}
      if (data.value) {
        const numValue = Number(data.value)
        if (step?.validation_criteria?.type === 'reps') {
          performanceData.reps_achieved = numValue
        } else if (step?.validation_criteria?.type === 'time') {
          performanceData.time_seconds = numValue
        } else if (step?.validation_criteria?.type === 'weight') {
          performanceData.weight_used = numValue
        } else {
          performanceData.quality_score = numValue
        }
      }
      await skillsService.logProgress({
        step_id: stepId,
        session_date: data.date,
        performance_data: performanceData,
        session_notes: data.notes || undefined,
      })
      toast.success('Session enregistree')
      setLogModal({ isOpen: false })
      const logs = await skillsService.getStepLogs(stepId)
      setStepLogs(prev => ({ ...prev, [stepId]: logs }))
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setLogModal(prev => prev.isOpen ? { ...prev, saving: false } : prev)
    }
  }

  const handleDeleteLog = async (logId: string, stepId: string) => {
    try {
      await skillsService.deleteLog(logId)
      toast.success('Log supprime')
      const logs = await skillsService.getStepLogs(stepId)
      setStepLogs(prev => ({ ...prev, [stepId]: logs }))
    } catch {
      toast.error('Erreur')
    }
  }

  const openWodModal = async (step: SkillStep) => {
    setWodModal({ isOpen: true, stepContext: step, generated: null, generating: false, saving: false })
    setWodIncludeWarmup(true)
    setBoxMode(false)

    const [equipRes, userProfile] = await Promise.allSettled([
      equipmentsLoaded ? Promise.resolve({ rows: allEquipments }) : getEquipments({ limit: 100 }),
      usersService.getUserProfile(),
    ])

    if (equipRes.status === 'fulfilled') {
      setAllEquipments(equipRes.value.rows)
      setEquipmentsLoaded(true)
    }

    if (userProfile.status === 'fulfilled' && userProfile.value.equipment_available?.length) {
      setUserProfileEquipment(userProfile.value.equipment_available)
      setWodSelectedEquipment(userProfile.value.equipment_available)
    }
  }

  const handleGenerateWod = async () => {
    if (!program || !wodModal.isOpen) return
    const step = wodModal.stepContext
    try {
      setWodModal(prev => prev.isOpen ? { ...prev, generating: true, generated: null } : prev)

      const exercisesList = step.recommended_exercises?.map(ex => {
        const details = [ex.sets && `${ex.sets}x`, ex.reps && `${ex.reps} reps`].filter(Boolean).join(' ')
        return details ? `${ex.name} (${details})` : ex.name
      }).join(', ') || ''

      const progressInfo = program.steps
        ? `Progression : ${program.steps.filter(s => s.status === 'completed').length}/${program.steps.length} etapes completees.`
        : ''

      const additionalInstructions = [
        `L'athlete travaille actuellement sur le skill "${program.skill_name}" (categorie: ${program.skill_category}).`,
        `Etape en cours : "${step.title}" - ${step.description}`,
        exercisesList && `Exercices de skill work realises : ${exercisesList}.`,
        progressInfo,
        `STRUCTURE OBLIGATOIRE DU WOD (sections dans cet ordre) :`,
        wodIncludeWarmup
          ? `1. Section type "warmup" : echauffement specifique pour le skill ${program.skill_name}.${step.warmup ? ` Base sur : ${step.warmup}.` : ''} Inclure mobilite articulaire et activation musculaire adaptees.`
          : null,
        `${wodIncludeWarmup ? '2' : '1'}. Section type "skill_work" : reprend les exercices de progression du skill (${exercisesList || program.skill_name}). IMPORTANT : specifier le champ "rounds" avec le nombre de tours et "rest_between_rounds" avec le repos en secondes.`,
        `${wodIncludeWarmup ? '3' : '2'}. Section metcon/amrap/for_time/emom : WOD complementaire qui ne surcharge pas les memes groupes musculaires, ou qui integre le skill ${program.skill_name} dans le metcon. IMPORTANT : toujours specifier le champ "rounds" quand il y a plusieurs tours.`,
        boxMode
          ? `L'athlete s'entraine dans une box CrossFit avec tout l'equipement standard disponible (barre, disques, kettlebell, rameur, airbike, corde, anneaux, etc.).`
          : wodSelectedEquipment.length > 0
            ? `CONTRAINTE EQUIPEMENT : L'athlete dispose UNIQUEMENT de : ${wodSelectedEquipment.map(slug => {
              const eq = allEquipments.find(e => e.slug === slug)
              return eq ? eq.label : slug
            }).join(', ')}. N'utilise AUCUN autre equipement.`
            : null,
        `Le nom du WOD doit mentionner "${program.skill_name}".`,
        `RAPPEL TECHNIQUE : chaque section doit avoir un champ "rounds" (nombre entier) quand il y a des tours, et "rest_between_rounds" (nombre entier en secondes) quand il y a du repos entre les tours.`,
      ].filter(Boolean).join(' ')

      const wod = await workoutsService.generateWorkoutWithAI({
        workoutType: 'metcon',
        difficulty: 'intermediate',
        duration: 30,
        equipment: boxMode ? undefined : (wodSelectedEquipment.length > 0 ? wodSelectedEquipment : undefined),
        additionalInstructions,
      })
      setWodModal(prev => prev.isOpen ? { ...prev, generated: wod } : prev)
    } catch {
      toast.error('Erreur lors de la generation du WOD')
    } finally {
      setWodModal(prev => prev.isOpen ? { ...prev, generating: false } : prev)
    }
  }

  const handleSaveWod = async () => {
    if (!wodModal.isOpen || !wodModal.generated || !program) return
    const { generated: generatedWod, stepContext: wodStepContext } = wodModal
    try {
      setWodModal(prev => prev.isOpen ? { ...prev, saving: true } : prev)

      const skillTag = `skill:${program.skill_name.toLowerCase().replace(/\s+/g, '-')}`
      const tags = [...(generatedWod.tags || []), skillTag, program.skill_category]

      const description = [
        generatedWod.description,
        `\n---\nSkill : ${program.skill_name} (${program.skill_category})`,
        wodStepContext ? `Etape : ${wodStepContext.title}` : null,
      ].filter(Boolean).join('\n')

      await workoutsService.createPersonalizedWorkout({
        name: generatedWod.name,
        description,
        workout_type: generatedWod.workout_type,
        blocks: generatedWod.blocks,
        estimated_duration: generatedWod.estimated_duration,
        difficulty: generatedWod.difficulty,
        intensity: generatedWod.intensity,
        tags,
        coach_notes: generatedWod.coach_notes,
      } as Workouts)
      toast.success('WOD sauvegarde dans vos workouts personnalises')
      setWodModal({ isOpen: false })
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setWodModal(prev => prev.isOpen ? { ...prev, saving: false } : prev)
    }
  }

  const getProgressPercent = () => {
    if (!program?.steps || program.steps.length === 0) return 0
    const completed = program.steps.filter(s => s.status === 'completed' || s.status === 'skipped').length
    return Math.round((completed / program.steps.length) * 100)
  }

  const chartDataByStep = useMemo(() => {
    const result: Record<string, { date: string; value: number }[]> = {}
    Object.entries(stepLogs).forEach(([stepId, logs]) => {
      result[stepId] = logs
        .slice()
        .reverse()
        .map(log => {
          const pd = (log.performance_data || {}) as Record<string, unknown>
          const value = pd.reps_achieved || pd.time_seconds || pd.weight_used || pd.quality_score || 0
          return {
            date: new Date(log.session_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            value: Number(value),
          }
        })
    })
    return result
  }, [stepLogs])

  return {
    program,
    loading,
    expandedStep,
    stepLogs,
    logModal,
    setLogModal,
    wodModal,
    setWodModal,
    wodIncludeWarmup,
    setWodIncludeWarmup,
    allEquipments,
    wodSelectedEquipment,
    setWodSelectedEquipment,
    boxMode,
    setBoxMode,
    userProfileEquipment,
    chartDataByStep,
    handleToggleStep,
    handleCompleteStep,
    handleSkipStep,
    handlePauseResume,
    handleAbandon,
    handleDelete,
    openLogModal,
    handleSaveLog,
    handleDeleteLog,
    openWodModal,
    handleGenerateWod,
    handleSaveWod,
    getProgressPercent,
  }
}
