import { createWorkout, generateWorkoutWithAI, getWorkout, updateWorkout } from '@/lib/api/admin'
import type { AdminWorkout, CreateWorkoutDTO } from '@/lib/types/workout'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface FormData {
  name: string
  description: string
  workout_type: string
  difficulty: string
  intensity: string
  estimated_duration: number
  status: string
  isActive: boolean
  isFeatured: boolean
  isPublic: boolean
  is_benchmark: boolean
  ai_generated: boolean
  sport_id: string
  blocks: string
  tags: string
  scheduled_date: string
  scaling_options: string
  equipment_required: string
  focus_areas: string
  metrics_tracked: string
  coach_notes: string
  target_metrics: string
  ai_parameters: string
  image_url: string
}

interface AIParams {
  sport_id: string
  sport_slug: string
  date: string
  duration_min: number
  intensity: string
  difficulty: string
  workout_type: string
  tags: string
}

/**
* Géneration de l'état et la soumission du formulaire d'entraînement.
*
* @param {string} id - ID de l'entraînement
* @param {boolean} isNewMode - Création ou modification d'un entraînement
* @returns {object} - Objet contenant l'état et les fonctions de gestion du formulaire
 */
export function useWorkoutForm(id: string, isNewMode: boolean) {
  const router = useRouter()
  const [loading, setLoading] = useState(!isNewMode)
  const [saving, setSaving] = useState(false)
  const [workout, setWorkout] = useState<AdminWorkout | null>(null)
  const [showAIModal, setShowAIModal] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    workout_type: '',
    difficulty: 'intermediate',
    intensity: '',
    estimated_duration: 0,
    status: 'draft',
    isActive: true,
    isFeatured: false,
    isPublic: true,
    is_benchmark: false,
    ai_generated: false,
    sport_id: '',
    blocks: '',
    tags: '',
    scheduled_date: '',
    scaling_options: '',
    equipment_required: '',
    focus_areas: '',
    metrics_tracked: '',
    coach_notes: '',
    target_metrics: '',
    ai_parameters: '',
    image_url: '',
  })

  const [aiParams, setAiParams] = useState<AIParams>({
    sport_id: '',
    sport_slug: '',
    date: '',
    duration_min: 45,
    intensity: 'moderate',
    difficulty: 'intermediate',
    workout_type: '',
    tags: '',
  })

  // Load workout data
  useEffect(() => {
    const fetchWorkout = async () => {
      if (isNewMode) {
        setLoading(false)
        return
      }

      try {
        const data = await getWorkout(id)
        setWorkout(data)
        setFormData({
          name: data.name || '',
          description: data.description || '',
          workout_type: data.workout_type || '',
          difficulty: data.difficulty || 'intermediate',
          intensity: data.intensity || '',
          estimated_duration: data.estimated_duration || 0,
          status: data.status || 'draft',
          isActive: data.isActive !== undefined ? data.isActive : true,
          isFeatured: data.isFeatured || false,
          isPublic: data.isPublic !== undefined ? data.isPublic : true,
          is_benchmark: false,
          ai_generated: data.ai_generated || false,
          sport_id: data.sport_id || '',
          blocks: data.blocks ? JSON.stringify(data.blocks, null, 2) : '',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
          scheduled_date: data.scheduled_date || '',
          scaling_options: '',
          equipment_required: '',
          focus_areas: '',
          metrics_tracked: '',
          coach_notes: '',
          target_metrics: '',
          ai_parameters: '',
          image_url: data.image_url || '',
        })
      } catch {
        toast.error('Erreur lors du chargement du workout')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkout()
  }, [id, isNewMode])

  // Helper function to parse JSON or comma-separated values
  const parseJsonOrArray = (value: string) => {
    if (!value.trim()) return undefined
    try {
      return JSON.parse(value)
    } catch {
      return value.split(',').map(v => v.trim()).filter(Boolean)
    }
  }

  // Submit workout form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const submitData: CreateWorkoutDTO = {
        name: formData.name,
        description: formData.description || undefined,
        workout_type: formData.workout_type || undefined,
        difficulty: formData.difficulty,
        intensity: formData.intensity || undefined,
        estimated_duration: formData.estimated_duration || undefined,
        status: formData.status,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        isPublic: formData.isPublic,
        sport_id: formData.sport_id || undefined,
        scheduled_date: formData.scheduled_date || undefined,
        tags: parseJsonOrArray(formData.tags),
        blocks: formData.blocks ? JSON.parse(formData.blocks) : undefined,
        image_url: formData.image_url || undefined,
      }

      if (isNewMode) {
        await createWorkout(submitData)
        toast.success('Workout cree avec succes')
      } else {
        await updateWorkout(id, submitData)
        toast.success('Workout mis a jour')
      }

      router.push('/admin/workouts')
    } catch (error) {
      console.error(error)
      toast.error(isNewMode ? 'Erreur lors de la creation du workout' : 'Erreur lors de la mise a jour du workout')
    } finally {
      setSaving(false)
    }
  }

  // Submit AI generation form
  const handleSubmitGenerateWorkout = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const generationParams = {
        sport: aiParams.sport_slug,
        workoutType: aiParams.workout_type || 'mixed',
        difficulty: aiParams.difficulty as 'beginner' | 'intermediate' | 'advanced' | 'elite',
        duration: aiParams.duration_min,
        focus: undefined,
        equipment: undefined,
        constraints: undefined,
        additionalInstructions: aiParams.tags || undefined,
      }

      const generatedWorkout = await generateWorkoutWithAI(generationParams)

      // Pre-fill form with generated data
      setFormData({
        ...formData,
        name: generatedWorkout.name || '',
        description: generatedWorkout.description || '',
        workout_type: generatedWorkout.workout_type || '',
        intensity: generatedWorkout.intensity || '',
        difficulty: generatedWorkout.difficulty || '',
        estimated_duration: generatedWorkout.estimated_duration || 0,
        sport_id: aiParams.sport_id,
        scheduled_date: aiParams.date,
        blocks: generatedWorkout.blocks ? JSON.stringify(generatedWorkout.blocks, null, 2) : '',
        tags: generatedWorkout.tags?.join(', ') || '',
        ai_generated: true,
      })

      setShowAIModal(false)
      toast.success('Workout genere avec succes!')
    } catch {
      toast.error('Erreur lors de la generation du workout')
    } finally {
      setSaving(false)
    }
  }

  return {
    loading,
    saving,
    workout,
    formData,
    setFormData,
    showAIModal,
    setShowAIModal,
    aiParams,
    setAiParams,
    handleSubmit,
    handleSubmitGenerateWorkout,
  }
}
