'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTimerSounds } from '@/hooks/useTimerSounds'

interface AMRAPTimerProps {
  duration: number
  onComplete?: () => void
  onTimeUpdate?: (time: string) => void
}

export function AMRAPTimer({ duration, onComplete, onTimeUpdate }: AMRAPTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const totalSeconds = duration * 60
  const sounds = useTimerSounds()

  // Gérer le countdown de 10 secondes
  useEffect(() => {
    if (countdown === null || countdown === 0) return

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null

        if (prev <= 1) {
          sounds.playStartSound()
          setIsRunning(true)
          return null
        }

        sounds.playCountdownBeep()
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown])

  // Gérer le timer principal
  useEffect(() => {
    if (!isRunning || countdown !== null) return

    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1
        const remaining = totalSeconds - next

        // Son d'alerte à 10 secondes de la fin
        if (remaining === 10) {
          sounds.playAlertSound()
        }

        // Son de fin
        if (next >= totalSeconds) {
          sounds.playFinishSound()
          setIsRunning(false)
          onComplete?.()
          return totalSeconds
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, totalSeconds, onComplete, countdown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const remainingSeconds = totalSeconds - elapsedSeconds
  const progressPercent = (elapsedSeconds / totalSeconds) * 100

  useEffect(() => {
    if (onTimeUpdate) {
      const timeString = formatTime(remainingSeconds)
      onTimeUpdate(timeString)
    }
  }, [remainingSeconds, onTimeUpdate])

  const reset = () => {
    setElapsedSeconds(0)
    setIsRunning(false)
    setCountdown(null)
  }

  const handleStart = () => {
    if (elapsedSeconds === 0 && !isRunning) {
      setCountdown(10)
    } else {
      setIsRunning(!isRunning)
    }
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-2 border-orange-300 dark:border-orange-800 rounded-xl p-4 space-y-3">
      {/* Afficher le countdown si actif */}
      {countdown !== null && countdown > 0 ? (
        <div className="text-center py-8">
          <div className="text-xs font-medium text-muted-foreground mb-2">Préparez-vous...</div>
          <div className="text-8xl font-bold font-mono text-orange-600 dark:text-orange-400 animate-pulse">
            {countdown}
          </div>
          <div className="text-sm text-muted-foreground mt-2">Get Ready!</div>
        </div>
      ) : (
        <>
          {/* Header compact avec timer et contrôles sur une ligne */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-center flex-1">
              <div className="text-xs font-medium text-muted-foreground mb-1">AMRAP Timer</div>
              <div className="text-4xl font-bold font-mono text-orange-600 dark:text-orange-400">
                {formatTime(remainingSeconds)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                restant / {formatTime(totalSeconds)}
              </div>
            </div>

            {/* Contrôles compacts */}
            <div className="flex gap-2">
              <button
                onClick={handleStart}
                disabled={elapsedSeconds >= totalSeconds}
                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-muted disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="hidden sm:inline">{elapsedSeconds > 0 && elapsedSeconds < totalSeconds ? 'Reprendre' : 'Start'}</span>
                  </>
                )}
              </button>
              <button
                onClick={reset}
                className="px-3 py-2 border-2 border-border hover:bg-accent rounded-lg transition-colors"
                title="Recommencer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {elapsedSeconds >= totalSeconds && (
            <div className="bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-800 rounded-lg p-2 text-center">
              <p className="font-semibold text-green-900 dark:text-green-100 text-sm">🎉 AMRAP Terminé !</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
