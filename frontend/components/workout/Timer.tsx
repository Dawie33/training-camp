'use client'

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

  // Calcul du pourcentage pour la barre de progression
  const progressPercentage = timeCapSeconds ? Math.min((seconds / timeCapSeconds) * 100, 100) : 0

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground mb-2">Timer</p>
        <div className="text-5xl font-mono font-bold mb-2">
          <span className={isOverTimeCap ? 'text-red-500' : ''}>{formatTime(seconds)}</span>
        </div>
        {timeCap && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Time cap: {timeCap} min
              {isOverTimeCap && <span className="text-red-500 ml-2">Dépassé!</span>}
            </p>
            {/* Barre de progression */}
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${isOverTimeCap ? 'bg-red-500' : 'bg-primary'
                  }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={toggleTimer}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 cursor-pointer" />
              <span className='cursor-pointer'>{hasStarted ? 'Reprendre' : 'Démarrer'}</span>
            </>
          )}
        </button>

        {hasStarted && (
          <button
            onClick={resetTimer}
            className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  )
}
