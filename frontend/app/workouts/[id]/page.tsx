'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { sportsService } from '@/services'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { useWorkoutForm } from './_hooks/useWorkoutForm'
import { WorkoutAIGenerationModal } from './components/WorkoutAIGenerationModal'
import { WorkoutForm } from './components/WorkoutForm'

/**
 * Page de modification d'un entrainement
 * @param {string} props.params.id - The workout id
 */
export default function WorkoutEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const isNewMode = id === 'new'

  // Load sports list
  const [sports, setSports] = useState<{ id: string; name: string; slug: string }[]>([])

  useEffect(() => {
    const fetchSports = async () => {
      const { rows } = await sportsService.getAll()
      setSports(rows)
    }
    fetchSports()
  }, [])

  // Use custom hook for workout form management
  const {
    loading,
    saving,
    formData,
    setFormData,
    showAIModal,
    setShowAIModal,
    aiParams,
    setAiParams,
    handleSubmit,
    handleSubmitGenerateWorkout,
  } = useWorkoutForm(id, isNewMode)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">
            {isNewMode ? 'Nouveau Workout' : 'Modifier Workout'}
          </h1>
        </div>

        {/* Main Form Card */}
        <Card>
          <CardContent className="pt-6">


            {/* AI Generation Modal */}
            <WorkoutAIGenerationModal
              isOpen={showAIModal}
              onClose={() => setShowAIModal(false)}
              onSubmit={handleSubmitGenerateWorkout}
              aiParams={aiParams}
              setAiParams={setAiParams}
              sports={sports}
              saving={saving}
            />

            {/* Workout Form */}
            <WorkoutForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              saving={saving}
              isNewMode={isNewMode}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
