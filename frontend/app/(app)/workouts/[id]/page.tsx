'use client'

import { Button } from '@/components/ui/button'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { useWorkoutForm } from './_hooks/useWorkoutForm'
import { WorkoutAIGenerationModal } from './components/WorkoutAIGenerationModal'
import { WorkoutForm } from './components/WorkoutForm'

/**
 * Page de création (`id === 'new'`) ou d'édition d'un workout, avec génération
 * assistée par IA optionnelle en mode création (modale `WorkoutAIGenerationModal`).
 */
export default function WorkoutEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const isNewMode = id === 'new'

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        className="max-w-4xl mx-auto p-6 space-y-6 pb-32"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4">
          <Button variant="ghost"
            aria-label="Retour"
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold text-foreground">
              {isNewMode ? 'Nouveau' : 'Modifier'}{' '}
              <span className="text-foreground">
                Workout
              </span>
            </h1>
            {isNewMode && (
              <p className="text-sm text-muted-foreground mt-1">
                Crée ton WOD rapidement
              </p>
            )}
          </div>

          {isNewMode && (
            <Button variant="default"
              type="button"
              onClick={() => setShowAIModal(true)}
              className="ml-auto px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-semibold text-sm"
            >
              ✨ Générer avec IA
            </Button>
          )}
        </motion.div>

        {/* AI Generation Modal */}
        <WorkoutAIGenerationModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onSubmit={handleSubmitGenerateWorkout}
          aiParams={aiParams}
          setAiParams={setAiParams}
          saving={saving}
        />

        {/* Workout Form */}
        <motion.div variants={fadeInUp}>
          <WorkoutForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            saving={saving}
            isNewMode={isNewMode}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
