'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { TimerConfig, TimerType } from '@/hooks/useWorkoutTimer'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { AnimatePresence, motion } from 'framer-motion'
import { Timer as TimerIcon } from 'lucide-react'
import { useState } from 'react'
import { ConfigView } from './components/ConfigView'
import { MenuView } from './components/MenuView'
import { RunningView } from './components/RunningView'
import { AMRAPTimer } from './timers/AMRAPTimer'
import { EMOMTimer } from './timers/EMOMTimer'
import { ForTimeTimer } from './timers/ForTimeTimer'
import { TabataTimer } from './timers/TabataTimer'

type TimerState = 'menu' | 'config' | 'running'

function TimerContent() {
  const [timerState, setTimerState] = useState<TimerState>('menu')
  const [selectedTimerType, setSelectedTimerType] = useState<TimerType | null>(null)
  const [timerConfig, setTimerConfig] = useState<TimerConfig | null>(null)

  const handleSelectType = (type: TimerType) => {
    setSelectedTimerType(type)
    setTimerState('config')
  }

  const handleStart = (config: TimerConfig) => {
    setTimerConfig(config)
    setTimerState('running')
  }

  const handleBack = () => {
    setTimerState('menu')
    setSelectedTimerType(null)
  }

  const handleClose = () => {
    setTimerState('menu')
    setSelectedTimerType(null)
    setTimerConfig(null)
  }

  const renderTimer = () => {
    if (!selectedTimerType || !timerConfig) return null

    switch (selectedTimerType) {
      case 'FOR_TIME':
        return <ForTimeTimer capMin={timerConfig.timeCap} />
      case 'AMRAP':
        return <AMRAPTimer duration={timerConfig.duration || 20} />
      case 'EMOM':
        return <EMOMTimer durationMin={timerConfig.duration || 10} intervalMin={timerConfig.intervalMinutes || 1} />
      case 'TABATA':
        return <TabataTimer rounds={timerConfig.rounds || 8} workSeconds={timerConfig.workSeconds || 20} restSeconds={timerConfig.restSeconds || 10} />
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-background p-4 sm:p-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Timers</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Choisissez et configurez votre timer d'entraînement
          </p>
        </motion.div>

        {/* Timer Views Container */}
        <motion.div
          variants={fadeInUp}
          className="flex justify-center items-start min-h-[200px]"
        >
          <AnimatePresence mode="wait">
            {timerState === 'menu' && (
              <MenuView
                onSelectType={handleSelectType}
              />
            )}

            {timerState === 'config' && selectedTimerType && (
              <ConfigView
                timerType={selectedTimerType}
                onStart={handleStart}
                onBack={handleBack}
              />
            )}

            {timerState === 'running' && (
              <RunningView
                onClose={handleClose}
              >
                {renderTimer()}
              </RunningView>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Instructions */}
        <motion.div variants={fadeInUp} className="mt-12 max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <TimerIcon className="w-5 h-5 text-primary" />
              Guide des timers
            </h3>
            <div className="text-sm text-muted-foreground space-y-3">
              <div>
                <strong className="text-foreground">For Time :</strong> Chronomètre pour mesurer votre temps de complétion. Parfait pour les WODs avec un nombre fixe de rounds.
              </div>
              <div>
                <strong className="text-foreground">AMRAP :</strong> As Many Rounds As Possible. Comptez le maximum de rounds dans un temps donné pour repousser vos limites.
              </div>
              <div>
                <strong className="text-foreground">EMOM :</strong> Every Minute On the Minute. Effectuez un exercice au début de chaque minute, le temps restant est votre repos.
              </div>
              <div>
                <strong className="text-foreground">Tabata :</strong> Intervalles haute intensité de 20 secondes de travail / 10 secondes de repos. Protocole scientifiquement prouvé.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function TimerPage() {
  return (
    <ProtectedRoute>
      <TimerContent />
    </ProtectedRoute>
  )
}
