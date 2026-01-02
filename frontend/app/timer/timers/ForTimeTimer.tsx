'use client'

import { Play, Pause, RotateCcw } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTimerSounds } from '@/hooks/useTimerSounds'

interface ForTimeTimerProps {
  capMin?: number
  onComplete?: () => void
  onTimeUpdate?: (time: string) => void
}

export function ForTimeTimer({ capMin, onComplete, onTimeUpdate }: ForTimeTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const sounds = useTimerSounds()
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

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
        if (capMin && next >= capMin * 60) {
          setIsRunning(false)
          onComplete?.()
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, capMin, onComplete, countdown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (onTimeUpdate) {
      const timeString = formatTime(elapsedSeconds)
      onTimeUpdate(timeString)
    }
  }, [elapsedSeconds, onTimeUpdate])

  // Gérer le Wake Lock pour empêcher l'écran de se mettre en veille
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isRunning) {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        }
      } catch (err) {
        console.log('Wake Lock error:', err)
      }
    }

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release()
          wakeLockRef.current = null
        } catch (err) {
          console.log('Wake Lock release error:', err)
        }
      }
    }

    if (isRunning) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }

    return () => {
      releaseWakeLock()
    }
  }, [isRunning])

  const reset = () => {
    setElapsedSeconds(0)
    setIsRunning(false)
    setIsFinished(false)
    setCountdown(null)
  }

  const finish = () => {
    sounds.playFinishSound()
    setIsRunning(false)
    setIsFinished(true)
    onComplete?.()
  }

  const handleStart = () => {
    if (elapsedSeconds === 0 && !isRunning && !isFinished) {
      setCountdown(10)
    } else {
      setIsRunning(!isRunning)
    }
  }

  const progressPercent = capMin ? (elapsedSeconds / (capMin * 60)) * 100 : 0

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-2 border-blue-300 dark:border-blue-800 rounded-xl p-6 space-y-4">
      {/* Afficher le countdown si actif */}
      {countdown !== null && countdown > 0 ? (
        <div className="text-center py-8">
          <div className="text-xs font-medium text-muted-foreground mb-2">Préparez-vous...</div>
          <div className="text-8xl font-bold font-mono text-blue-600 dark:text-blue-400 animate-pulse">
            {countdown}
          </div>
          <div className="text-sm text-muted-foreground mt-2">Get Ready!</div>
        </div>
      ) : (
        <>
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground mb-1">For Time</div>
            <div className="text-6xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {formatTime(elapsedSeconds)}
            </div>
            {capMin && (
              <div className="text-sm text-muted-foreground mt-1">
                Cap : {capMin} min
              </div>
            )}
          </div>

          {/* Barre de progression si cap défini */}
          {capMin && (
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          )}

          {/* Contrôles */}
          <div className="flex gap-2">
            <button
              onClick={handleStart}
              disabled={isFinished}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {elapsedSeconds > 0 ? 'Reprendre' : 'Démarrer'}
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 border-2 border-border hover:bg-accent rounded-lg transition-colors"
              title="Recommencer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {!isFinished && isRunning && (
            <button
              onClick={finish}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ✓ Terminer maintenant
            </button>
          )}

          {isFinished && (
            <div className="bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-800 rounded-lg p-3 text-center">
              <p className="font-semibold text-green-900 dark:text-green-100">
                🎉 Terminé en {formatTime(elapsedSeconds)} !
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
