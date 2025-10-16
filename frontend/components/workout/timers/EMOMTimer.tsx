'use client'

import { Play, Pause, RotateCcw, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

interface EMOMTimerProps {
  durationMin: number
  intervalMin?: number
  onComplete?: () => void
}

export function EMOMTimer({ durationMin, intervalMin = 1, onComplete }: EMOMTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const totalSeconds = durationMin * 60
  const intervalSeconds = intervalMin * 60
  const currentRound = Math.floor(elapsedSeconds / intervalSeconds) + 1
  const totalRounds = Math.ceil(totalSeconds / intervalSeconds)
  const roundElapsed = elapsedSeconds % intervalSeconds

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

  const reset = () => {
    setElapsedSeconds(0)
    setIsRunning(false)
  }

  const skipToNextRound = () => {
    const nextRoundStart = currentRound * intervalSeconds
    setElapsedSeconds(nextRoundStart)
  }

  const progressPercent = (elapsedSeconds / totalSeconds) * 100
  const roundProgressPercent = (roundElapsed / intervalSeconds) * 100

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-300 dark:border-purple-800 rounded-xl p-6 space-y-4">
      {/* Round actuel */}
      <div className="text-center">
        <div className="text-sm font-medium text-muted-foreground mb-1">EMOM</div>
        <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
          Round {currentRound} / {totalRounds}
        </div>
      </div>

      {/* Timer du round */}
      <div className="text-center">
        <div className="text-sm text-muted-foreground mb-1">Temps dans le round</div>
        <div className="text-4xl font-bold font-mono text-purple-600 dark:text-purple-400">
          {formatTime(roundElapsed)}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          / {formatTime(intervalSeconds)}
        </div>
      </div>

      {/* Barre de progression du round */}
      <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-linear"
          style={{ width: `${roundProgressPercent}%` }}
        />
      </div>

      {/* Progression totale */}
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Temps total: {formatTime(elapsedSeconds)}</span>
        <span>{formatTime(totalSeconds)}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-purple-300 dark:bg-purple-700 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Contrôles */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          disabled={elapsedSeconds >= totalSeconds}
          className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-muted disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
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
        {isRunning && currentRound < totalRounds && (
          <button
            onClick={skipToNextRound}
            className="px-4 py-3 border-2 border-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
            title="Round suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
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
          <p className="font-semibold text-green-900 dark:text-green-100">
            🎉 EMOM Terminé ! {totalRounds} rounds complétés
          </p>
        </div>
      )}
    </div>
  )
}
