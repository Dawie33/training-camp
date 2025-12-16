'use client'

import { motion } from 'framer-motion'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TimerProps {
  timeCap?: number // Time cap en minutes
}

export function Timer({ timeCap }: TimerProps) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
    if (!hasStarted) setHasStarted(true)
  }

  const resetTimer = () => {
    setSeconds(0)
    setIsRunning(false)
    setHasStarted(false)
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Vérifier si on a dépassé le time cap
  const isOverTimeCap = timeCap && seconds > timeCap * 60
  const timeCapSeconds = timeCap ? timeCap * 60 : null

  // Calcul du pourcentage pour la barre de progression (cercle)
  const progressPercentage = timeCapSeconds ? Math.min((seconds / timeCapSeconds) * 100, 100) : 0
  const circumference = 2 * Math.PI * 120 // rayon de 120
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div className="flex flex-col items-center">
        {/* Timer circulaire style Freeletics */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-6 sm:mb-8">
          {/* Cercle de progression */}
          {timeCap && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              {/* Background circle */}
              <circle
                cx="50%"
                cy="50%"
                r="120"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50%"
                cy="50%"
                r="120"
                fill="none"
                stroke={isOverTimeCap ? '#ef4444' : 'hsl(var(--primary))'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
              />
            </svg>
          )}

          {/* Timer au centre */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              className={`text-6xl sm:text-7xl font-black font-mono tracking-tight ${
                isOverTimeCap ? 'text-red-500' : 'text-white'
              }`}
              animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {formatTime(seconds)}
            </motion.div>
            {timeCap && (
              <div className="mt-2 text-sm text-gray-400">
                {isOverTimeCap ? (
                  <span className="text-red-400 font-semibold">Time cap dépassé!</span>
                ) : (
                  <span>Cap: {timeCap} min</span>
                )}
              </div>
            )}
          </div>

          {/* Pulse animation quand actif */}
          {isRunning && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3 sm:gap-4 w-full max-w-md">
          <motion.button
            onClick={toggleTimer}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-base uppercase tracking-wider transition-all ${
              isRunning
                ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500/30'
                : 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>{hasStarted ? 'Reprendre' : 'Start'}</span>
              </>
            )}
          </motion.button>

          {hasStarted && (
            <motion.button
              onClick={resetTimer}
              className="px-4 py-4 border-2 border-white/10 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
