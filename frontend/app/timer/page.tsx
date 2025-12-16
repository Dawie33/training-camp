'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AMRAPTimer } from '@/components/workout/timers/AMRAPTimer'
import { EMOMTimer } from '@/components/workout/timers/EMOMTimer'
import { ForTimeTimer } from '@/components/workout/timers/ForTimeTimer'
import { TabataTimer } from '@/components/workout/timers/TabataTimer'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
import { Clock, Timer as TimerIcon, Zap, TrendingUp, Target } from 'lucide-react'
import { useState } from 'react'

type TimerType = 'fortime' | 'amrap' | 'emom' | 'tabata'

function TimerContent() {
  const [selectedTimer, setSelectedTimer] = useState<TimerType>('fortime')

  const timerTypes = [
    {
      id: 'fortime' as TimerType,
      name: 'For Time',
      icon: Clock,
      description: 'Chronomètre classique avec time cap optionnel',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      id: 'amrap' as TimerType,
      name: 'AMRAP',
      icon: Zap,
      description: 'As Many Rounds As Possible',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30'
    },
    {
      id: 'emom' as TimerType,
      name: 'EMOM',
      icon: TrendingUp,
      description: 'Every Minute On the Minute',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    },
    {
      id: 'tabata' as TimerType,
      name: 'Tabata',
      icon: Target,
      description: 'Intervalles 20s/10s',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    }
  ]

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
            Choisissez le type de timer pour votre entraînement
          </p>
        </motion.div>

        {/* Timer Type Selector */}
        <motion.div variants={fadeInUp} className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {timerTypes.map((timer) => {
              const Icon = timer.icon
              const isSelected = selectedTimer === timer.id

              return (
                <motion.button
                  key={timer.id}
                  onClick={() => setSelectedTimer(timer.id)}
                  className={`relative p-4 sm:p-6 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? `${timer.bgColor} ${timer.borderColor} shadow-lg`
                      : 'bg-card border-border hover:border-primary/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`p-3 rounded-xl ${isSelected ? timer.bgColor : 'bg-accent'}`}>
                      <Icon className={`w-6 h-6 ${isSelected ? timer.color : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-base sm:text-lg ${isSelected ? '' : 'text-muted-foreground'}`}>
                        {timer.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                        {timer.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Timer Display */}
        <motion.div variants={fadeInUp} className="w-full max-w-3xl mx-auto">
          {selectedTimer === 'fortime' && <ForTimeTimer capMin={20} />}
          {selectedTimer === 'amrap' && <AMRAPTimer duration={20} />}
          {selectedTimer === 'emom' && <EMOMTimer durationMin={10} intervalMin={1} />}
          {selectedTimer === 'tabata' && <TabataTimer rounds={8} workSeconds={20} restSeconds={10} />}
        </motion.div>

        {/* Instructions */}
        <motion.div variants={fadeInUp} className="mt-8 max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <TimerIcon className="w-5 h-5 text-primary" />
              À propos de {timerTypes.find(t => t.id === selectedTimer)?.name}
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              {selectedTimer === 'fortime' && (
                <>
                  <p><strong>For Time</strong> : Chronomètre classique pour mesurer votre temps de complétion.</p>
                  <p>Parfait pour les WODs avec un nombre fixe de rounds ou de répétitions.</p>
                </>
              )}
              {selectedTimer === 'amrap' && (
                <>
                  <p><strong>AMRAP</strong> : Comptez le maximum de rounds possibles dans un temps donné.</p>
                  <p>Idéal pour repousser vos limites et mesurer votre endurance.</p>
                </>
              )}
              {selectedTimer === 'emom' && (
                <>
                  <p><strong>EMOM</strong> : Effectuez un exercice au début de chaque minute.</p>
                  <p>Le temps restant est votre repos avant la minute suivante.</p>
                </>
              )}
              {selectedTimer === 'tabata' && (
                <>
                  <p><strong>Tabata</strong> : Intervalles haute intensité de 20 secondes de travail / 10 secondes de repos.</p>
                  <p>Protocole scientifiquement prouvé pour améliorer la capacité aérobie et anaérobie.</p>
                </>
              )}
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
