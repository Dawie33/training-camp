'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AMRAPTimerProps {
  duration: number
  onComplete?: () => void
  onTimeUpdate?: (time: string) => void
}

export function AMRAPTimer({ duration, onComplete, onTimeUpdate }: AMRAPTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const totalSeconds = duration * 60

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1
        if (next >= totalSeconds) {
          setIsRunning(false)
          onComplete?.()
          return totalSeconds
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, totalSeconds, onComplete])

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
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-2 border-orange-300 dark:border-orange-800 rounded-xl p-6 space-y-4">
      <div className="text-center">
        <div className="text-sm font-medium text-muted-foreground mb-1">AMRAP Timer</div>
        <div className="text-6xl font-bold font-mono text-orange-600 dark:text-orange-400">
          {formatTime(remainingSeconds)}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          restant / {formatTime(totalSeconds)}
        </div>
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Rounds compteur */}
      <div className="text-center">
        <div className="text-sm text-muted-foreground">Temps écoulé</div>
        <div className="text-2xl font-bold font-mono">{formatTime(elapsedSeconds)}</div>
      </div>

      {/* Contrôles */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          disabled={elapsedSeconds >= totalSeconds}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-muted disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              {elapsedSeconds > 0 && elapsedSeconds < totalSeconds ? 'Reprendre' : 'Démarrer'}
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

      {elapsedSeconds >= totalSeconds && (
        <div className="bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-800 rounded-lg p-3 text-center">
          <p className="font-semibold text-green-900 dark:text-green-100">🎉 AMRAP Terminé !</p>
        </div>
      )}
    </div>
  )
}
