'use client'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { ProgramForm } from './_components/ProgramForm'
import { ProgramPreview } from './_components/ProgramPreview'
import { useGenerateProgram } from './_hooks/useGenerateProgram'

function GenerateProgramContent() {
  const {
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
  } = useGenerateProgram()

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center gap-3">
        <button
          onClick={() => (step === 'preview' ? setStep('form') : router.push('/training-programs'))}
          className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-semibold leading-none tracking-tight">
            {step === 'form' ? 'Créer un programme' : 'Aperçu du programme'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {step === 'form' ? 'Généré par IA, adapté à ton niveau' : 'Vérifie les détails avant de confirmer'}
          </p>
        </div>
      </motion.div>

      <div className="rule-strong" />

      {/* Étape 1 : Formulaire */}
      {step === 'form' && (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <ProgramForm
            programType={programType}
            onProgramTypeChange={setProgramType}
            duration={duration}
            onDurationChange={setDuration}
            sessions={sessions}
            onSessionsChange={setSessions}
            level={level}
            onLevelChange={setLevel}
            focus={focus}
            onFocusChange={setFocus}
            generating={generating}
            onGenerate={handleGenerate}
          />
        </motion.div>
      )}

      {/* Étape 2 : Preview */}
      {step === 'preview' && preview && (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <ProgramPreview
            preview={preview}
            duration={duration}
            sessions={sessions}
            level={level}
            expandedPhase={expandedPhase}
            onToggleExpandedPhase={setExpandedPhase}
            saving={saving}
            onBack={() => setStep('form')}
            onConfirm={handleConfirm}
          />
        </motion.div>
      )}
    </motion.div>
  )
}

export default function GenerateProgramPage() {
  return <GenerateProgramContent />
}
