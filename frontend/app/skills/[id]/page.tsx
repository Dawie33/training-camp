'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RichSectionDisplay } from '@/components/workout/display/RichSectionDisplay'
import type { Equipment } from '@/domain/entities/equipment'
import type { SkillProgram, SkillProgressLog, SkillStep } from '@/domain/entities/skill'
import type { GeneratedWorkout, Workouts } from '@/domain/entities/workout'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { getEquipments } from '@/services/equipments'
import { skillsService } from '@/services/skills'
import { usersService } from '@/services/users'
import { workoutsService } from '@/services/workouts'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Dumbbell,
  FastForward,
  Loader2,
  Lock,
  Pause,
  Play,
  Plus,
  Save,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'

const statusIcons: Record<string, React.ReactNode> = {
  locked: <Lock className="w-5 h-5 text-slate-500" />,
  in_progress: <Play className="w-5 h-5 text-orange-400" />,
  completed: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  skipped: <FastForward className="w-5 h-5 text-yellow-400" />,
}

const statusLabels: Record<string, string> = {
  locked: 'Verrouille',
  in_progress: 'En cours',
  completed: 'Termine',
  skipped: 'Passe',
}

const programStatusLabels: Record<string, string> = {
  active: 'Actif',
  completed: 'Termine',
  paused: 'En pause',
  abandoned: 'Abandonne',
}

function SkillDetailContent() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [program, setProgram] = useState<SkillProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [stepLogs, setStepLogs] = useState<Record<string, SkillProgressLog[]>>({})

  // Log session modal
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logStepId, setLogStepId] = useState<string | null>(null)
  const [logData, setLogData] = useState({ value: '', notes: '', date: new Date().toISOString().split('T')[0] })
  const [savingLog, setSavingLog] = useState(false)

  // WOD generation
  const [wodModalOpen, setWodModalOpen] = useState(false)
  const [generatedWod, setGeneratedWod] = useState<GeneratedWorkout | null>(null)
  const [generatingWod, setGeneratingWod] = useState(false)
  const [savingWod, setSavingWod] = useState(false)
  const [wodStepContext, setWodStepContext] = useState<SkillStep | null>(null)
  const [wodIncludeWarmup, setWodIncludeWarmup] = useState(true)
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([])
  const [wodSelectedEquipment, setWodSelectedEquipment] = useState<string[]>([])
  const [equipmentsLoaded, setEquipmentsLoaded] = useState(false)
  const [boxMode, setBoxMode] = useState(false)
  const [userProfileEquipment, setUserProfileEquipment] = useState<string[]>([])

  const fetchProgram = useCallback(async () => {
    try {
      setLoading(true)
      const data = await skillsService.getOne(id)
      setProgram(data)
      // Auto-expand active step
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

  const handleCompleteStep = async (stepId: string) => {
    try {
      await skillsService.updateStep(id, stepId, { status: 'completed' })
      toast.success('Etape marquee comme terminee')
      fetchProgram()
    } catch {
      toast.error('Erreur')
    }
  }

  const handleSkipStep = async (stepId: string) => {
    try {
      await skillsService.updateStep(id, stepId, { status: 'skipped', manually_overridden: true })
      toast.success('Etape passee')
      fetchProgram()
    } catch {
      toast.error('Erreur')
    }
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
    setLogStepId(stepId)
    setLogData({ value: '', notes: '', date: new Date().toISOString().split('T')[0] })
    setLogModalOpen(true)
  }

  const handleSaveLog = async () => {
    if (!logStepId) return
    try {
      setSavingLog(true)
      const step = program?.steps?.find(s => s.id === logStepId)
      const performanceData: Record<string, unknown> = {}
      if (logData.value) {
        const numValue = Number(logData.value)
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
        step_id: logStepId,
        session_date: logData.date,
        performance_data: performanceData,
        session_notes: logData.notes || undefined,
      })
      toast.success('Session enregistree')
      setLogModalOpen(false)
      // Refresh logs for this step
      const logs = await skillsService.getStepLogs(logStepId)
      setStepLogs(prev => ({ ...prev, [logStepId]: logs }))
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSavingLog(false)
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
    setWodStepContext(step)
    setGeneratedWod(null)
    setWodIncludeWarmup(true)
    setBoxMode(false)
    setWodModalOpen(true)

    // Charger les équipements de la DB et pré-remplir depuis le profil user en parallèle
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
    if (!program || !wodStepContext) return
    const step = wodStepContext
    try {
      setGeneratingWod(true)
      setGeneratedWod(null)

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
      setGeneratedWod(wod)
    } catch {
      toast.error('Erreur lors de la generation du WOD')
    } finally {
      setGeneratingWod(false)
    }
  }

  const handleSaveWod = async () => {
    if (!generatedWod || !program) return
    try {
      setSavingWod(true)

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
      setWodModalOpen(false)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSavingWod(false)
    }
  }

  const getProgressPercent = () => {
    if (!program?.steps || program.steps.length === 0) return 0
    const completed = program.steps.filter(s => s.status === 'completed' || s.status === 'skipped').length
    return Math.round((completed / program.steps.length) * 100)
  }

  const getChartData = (stepId: string) => {
    const logs = stepLogs[stepId] || []
    return logs
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
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    )
  }

  if (!program) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Programme non trouve</p>
      </div>
    )
  }

  const progress = getProgressPercent()

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <Button variant="ghost" onClick={() => router.push('/skills')} className="text-slate-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux progressions
        </Button>

        <Card className="bg-white/5 border-white/10 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{program.skill_name}</h1>
              <p className="text-slate-400 mt-1">{program.description}</p>
            </div>
            <Badge className={program.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-300'}>
              {programStatusLabels[program.status]}
            </Badge>
          </div>

          {/* Progress */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">
                {program.steps?.filter(s => s.status === 'completed' || s.status === 'skipped').length || 0} / {program.steps?.length || 0} etapes
              </span>
              <span className="text-orange-400 font-medium">{progress}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {program.status !== 'completed' && program.status !== 'abandoned' && (
              <>
                <Button variant="outline" onClick={handlePauseResume} className="border-white/10 text-slate-300 hover:bg-white/5">
                  {program.status === 'paused' ? (
                    <><Play className="w-4 h-4 mr-2" /> Reprendre</>
                  ) : (
                    <><Pause className="w-4 h-4 mr-2" /> Pause</>
                  )}
                </Button>
                <Button variant="outline" onClick={handleAbandon} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  <XCircle className="w-4 h-4 mr-2" /> Abandonner
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleDelete} className="ml-auto border-red-500/30 text-red-400 hover:bg-red-500/10">
              <Trash2 className="w-4 h-4 mr-2" /> Supprimer
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Safety notes */}
      {program.safety_notes && (
        <motion.div variants={fadeInUp}>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-300 text-sm font-medium mb-1">Notes de securite</p>
            <p className="text-red-200/80 text-sm">{program.safety_notes}</p>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <motion.div variants={fadeInUp} className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Etapes de progression</h2>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-white/10" />

          <div className="space-y-4">
            {program.steps?.map((step) => {
              const isExpanded = expandedStep === step.id
              const isActive = step.status === 'in_progress'
              const logs = stepLogs[step.id] || []
              const chartData = getChartData(step.id)

              return (
                <div key={step.id} className="relative pl-12">
                  {/* Status icon on timeline */}
                  <div className={`absolute left-0 top-3 w-10 h-10 rounded-full flex items-center justify-center z-10 ${isActive ? 'bg-orange-500/20 ring-2 ring-orange-500/50' :
                    step.status === 'completed' ? 'bg-emerald-500/20' :
                      step.status === 'skipped' ? 'bg-yellow-500/20' :
                        'bg-white/5'
                    }`}>
                    {statusIcons[step.status]}
                  </div>

                  <Card className={`bg-white/5 border-white/10 ${isActive ? 'ring-1 ring-orange-500/30' : ''}`}>
                    {/* Step header - clickable */}
                    <button
                      onClick={() => handleToggleStep(step.id)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">#{step.step_number}</span>
                        <span className="font-medium text-white">{step.title}</span>
                        <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-slate-400">
                          {statusLabels[step.status]}
                        </Badge>
                        {step.manually_overridden && (
                          <Badge variant="outline" className="text-xs bg-yellow-500/10 border-yellow-500/20 text-yellow-400">Manuel</Badge>
                        )}
                      </div>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                        <p className="text-slate-400 text-sm">{step.description}</p>

                        {/* Validation criteria */}
                        {step.validation_criteria && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">Critere de validation</p>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm text-emerald-300">{step.validation_criteria.description}</span>
                            </div>
                          </div>
                        )}

                        {/* Recommended exercises */}
                        {step.recommended_exercises && step.recommended_exercises.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 mb-2">Exercices recommandes</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {step.recommended_exercises.map((ex, i) => (
                                <div key={i} className="bg-white/5 rounded-lg px-3 py-2">
                                  <p className="text-sm text-white font-medium">{ex.name}</p>
                                  <p className="text-xs text-slate-400">
                                    {[
                                      ex.sets && `${ex.sets} series`,
                                      ex.reps && `${ex.reps} reps`,
                                      ex.rest && `repos ${ex.rest}`,
                                    ].filter(Boolean).join(' - ')}
                                  </p>
                                  {ex.notes && <p className="text-xs text-slate-500 mt-1">{ex.notes}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Programming info */}
                        {(step.frequency || step.when_to_train || step.warmup) && (
                          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 space-y-1">
                            <p className="text-xs text-orange-300 font-medium mb-1">Programmation</p>
                            {step.frequency && (
                              <p className="text-sm text-orange-200/80"><span className="text-orange-300 font-medium">Frequence :</span> {step.frequency}</p>
                            )}
                            {step.when_to_train && (
                              <p className="text-sm text-orange-200/80"><span className="text-orange-300 font-medium">Quand :</span> {step.when_to_train}</p>
                            )}
                            {step.warmup && (
                              <p className="text-sm text-orange-200/80"><span className="text-orange-300 font-medium">Echauffement :</span> {step.warmup}</p>
                            )}
                          </div>
                        )}

                        {/* Coaching tips */}
                        {step.coaching_tips && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <p className="text-xs text-blue-300 font-medium mb-1">Conseils</p>
                            <p className="text-sm text-blue-200/80">{step.coaching_tips}</p>
                          </div>
                        )}

                        {/* Actions for active step */}
                        {isActive && program.status === 'active' && (
                          <div className="flex flex-wrap gap-3 pt-2">
                            <Button
                              size="sm"
                              onClick={() => openLogModal(step.id)}
                              className="bg-gradient-to-r from-orange-500 to-rose-500"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Logger session
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openWodModal(step)}
                              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                            >
                              <Dumbbell className="w-3 h-3 mr-1" />
                              Generer un WOD
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteStep(step.id)}
                              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Marquer complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSkipStep(step.id)}
                              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                            >
                              <FastForward className="w-3 h-3 mr-1" />
                              Passer
                            </Button>
                          </div>
                        )}

                        {/* Progress chart */}
                        {chartData.length > 1 && (
                          <div>
                            <p className="text-xs text-slate-500 mb-2">Progression</p>
                            <div className="bg-white/5 rounded-lg p-4 h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                                  <YAxis stroke="#64748b" fontSize={11} />
                                  <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                  />
                                  <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {/* Session logs */}
                        {logs.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 mb-2">Historique sessions</p>
                            <div className="space-y-2">
                              {logs.map((log) => {
                                const pd = (log.performance_data || {}) as Record<string, unknown>
                                return (
                                  <div key={log.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-3">
                                      <Clock className="w-3 h-3 text-slate-500" />
                                      <span className="text-xs text-slate-400">
                                        {new Date(log.session_date).toLocaleDateString('fr-FR')}
                                      </span>
                                      <span className="text-sm text-white">
                                        {Object.entries(pd).map(([k, v]) => {
                                          if (k === 'reps_achieved') return `${v} reps`
                                          if (k === 'time_seconds') return `${v}s`
                                          if (k === 'weight_used') return `${v} kg`
                                          if (k === 'quality_score') return `${v}/10`
                                          return `${v}`
                                        }).join(', ')}
                                      </span>
                                      {log.session_notes && (
                                        <span className="text-xs text-slate-500">- {log.session_notes}</span>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteLog(log.id, step.id)}
                                      className="text-slate-500 hover:text-red-400 h-6 w-6 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Log Session Modal */}
      <Dialog open={logModalOpen} onOpenChange={setLogModalOpen}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Logger une session</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Date</Label>
              <Input
                type="date"
                value={logData.date}
                onChange={(e) => setLogData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              {(() => {
                const step = program?.steps?.find(s => s.id === logStepId)
                const vc = step?.validation_criteria
                const label = vc?.description || (() => {
                  if (vc?.type === 'reps') return 'Repetitions realisees'
                  if (vc?.type === 'time') return 'Duree (secondes)'
                  if (vc?.type === 'weight') return 'Charge (kg)'
                  return 'Score qualite (1-10)'
                })()
                const placeholder = vc?.target ? `Objectif : ${vc.target} ${vc.unit || ''}`.trim() : 'Entrez la valeur'
                return (
                  <>
                    <Label className="text-white">{label}</Label>
                    <Input
                      type="number"
                      value={logData.value}
                      onChange={(e) => setLogData(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={placeholder}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </>
                )
              })()}
            </div>

            <div className="space-y-2">
              <Label className="text-white">Notes (optionnel)</Label>
              <Textarea
                value={logData.notes}
                onChange={(e) => setLogData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Comment s'est passee la session..."
                className="bg-white/5 border-white/10 text-white min-h-[80px]"
              />
            </div>

            <Button
              onClick={handleSaveLog}
              disabled={savingLog || !logData.value}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-500"
            >
              {savingLog ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WOD Generation Modal */}
      <Dialog open={wodModalOpen} onOpenChange={setWodModalOpen}>
        <DialogContent className="bg-slate-900 border-white/10 max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-blue-400" />
              WOD complementaire
            </DialogTitle>
          </DialogHeader>

          {/* Skill context banner */}
          {program && wodStepContext && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-orange-300 font-medium">{program.skill_name}</span>
                <span className="text-slate-500">-</span>
                <span className="text-orange-200/80">{wodStepContext.title}</span>
              </div>
              {wodStepContext.recommended_exercises && wodStepContext.recommended_exercises.length > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Exercices integres : {wodStepContext.recommended_exercises.map(ex => ex.name).join(', ')}
                </p>
              )}
            </div>
          )}

          {generatingWod ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-slate-400 text-sm">Generation du WOD en cours...</p>
            </div>
          ) : generatedWod ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold">{generatedWod.name}</h3>
                {generatedWod.description && (
                  <p className="text-slate-400 text-sm mt-1">{generatedWod.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-orange-500/20 text-orange-300">
                  {generatedWod.workout_type?.replace(/_/g, ' ')}
                </Badge>
                <Badge className="bg-slate-500/20 text-slate-300">
                  {generatedWod.difficulty}
                </Badge>
                <Badge className="bg-slate-500/20 text-slate-300">
                  {generatedWod.estimated_duration} min
                </Badge>
                <Badge className="bg-slate-500/20 text-slate-300">
                  {generatedWod.intensity}
                </Badge>
              </div>

              {generatedWod.blocks?.sections && (
                <div className="space-y-4">
                  {generatedWod.blocks.sections.map((section, idx) => (
                    <RichSectionDisplay key={idx} section={section} />
                  ))}
                </div>
              )}

              {generatedWod.coach_notes && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-blue-300 font-medium mb-1">Notes du coach</p>
                  <p className="text-sm text-blue-200/80">{generatedWod.coach_notes}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setGeneratedWod(null)}
                  variant="outline"
                  className="flex-1 border-white/10 text-slate-300 hover:bg-white/5"
                >
                  Regenerer
                </Button>
                <Button
                  onClick={handleSaveWod}
                  disabled={savingWod}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500"
                >
                  {savingWod ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Config phase - equipment + warmup selection */
            <div className="space-y-4">
              {/* Warmup toggle */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setWodIncludeWarmup(!wodIncludeWarmup)}
                  className={`w-full text-left rounded-lg p-3 border transition-all ${wodIncludeWarmup
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-white/5 border-white/10'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Inclure l&apos;echauffement</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {wodStepContext?.warmup || `Echauffement adapte au ${program?.skill_name || 'skill'}`}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${wodIncludeWarmup
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-500'
                      }`}>
                      {wodIncludeWarmup && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>
              </div>

              {/* Equipment selection */}
              <div className="space-y-2">
                <Label className="text-white">Lieu d&apos;entrainement</Label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBoxMode(false)
                      setWodSelectedEquipment(userProfileEquipment)
                    }}
                    className={`text-left rounded-lg p-3 border transition-all ${!boxMode
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-white/5 border-white/10'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Mon equipement</p>
                        <p className="text-xs text-slate-400 mt-0.5">{userProfileEquipment.length} piece(s)</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 transition-all ${!boxMode ? 'bg-orange-500 border-orange-500' : 'border-slate-500'}`} />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBoxMode(true)
                      setWodSelectedEquipment(allEquipments.map(e => e.slug))
                    }}
                    className={`text-left rounded-lg p-3 border transition-all ${boxMode
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-white/5 border-white/10'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Box CrossFit</p>
                        <p className="text-xs text-slate-400 mt-0.5">Tout l&apos;equipement</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 transition-all ${boxMode ? 'bg-blue-500 border-blue-500' : 'border-slate-500'}`} />
                    </div>
                  </button>
                </div>
              </div>

              <Button
                onClick={handleGenerateWod}
                disabled={generatingWod}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Generer le WOD
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default function SkillDetailPage() {
  return (
    <ProtectedRoute>
      <SkillDetailContent />
    </ProtectedRoute>
  )
}
