'use client'

import { AMRAPRound, TimerConfig, TimerType } from "@/hooks/useWorkoutTimer"
import { useEffect, useState } from "react"

interface MultiRoundTimerProps {
    timerType: TimerType
    timerConfig: TimerConfig
    renderTimer: (config: TimerConfig, onComplete: () => void, onTimeUpdate?: (time: string) => void) => React.ReactNode
    onTimeUpdate?: (time: string) => void
    onAllComplete?: () => void
}

/**
 * Wrapper pour gérer les sessions multiples d'un timer avec récupération entre chaque
 *
 * Exemple pour TABATA:
 * - Session 1: 8 rounds de 20s/10s
 * - Récupération: 1 minute
 * - Session 2: 4 rounds de 20s/10s
 * - Récupération: 1 minute
 * - Session 3: 4 rounds de 20s/10s
 */
export function MultiRoundTimer({ timerType, timerConfig, renderTimer, onTimeUpdate, onAllComplete }: MultiRoundTimerProps) {
    const [currentSessionIndex, setCurrentSessionIndex] = useState(0)
    const [isResting, setIsResting] = useState(false)
    const [restTimeRemaining, setRestTimeRemaining] = useState(0)

    // Construire la liste des sessions selon le type de timer
    const getSessions = () => {
        const sessions: Array<{ config: TimerConfig; restAfter: number }> = []

        switch (timerType) {
            case 'TABATA':
                // Session principale
                sessions.push({
                    config: {
                        rounds: timerConfig.rounds,
                        workSeconds: timerConfig.workSeconds,
                        restSeconds: timerConfig.restSeconds
                    },
                    restAfter: timerConfig.tabataRound ? timerConfig.tabataRound.rest * 60 : 0
                })

                // Session supplémentaire si configurée
                if (timerConfig.tabataRound) {
                    sessions.push({
                        config: {
                            rounds: timerConfig.tabataRound.round,
                            workSeconds: timerConfig.workSeconds,
                            restSeconds: timerConfig.restSeconds
                        },
                        restAfter: 0
                    })
                }
                break

            case 'AMRAP':
                // Première session AMRAP
                sessions.push({
                    config: { duration: timerConfig.duration },
                    restAfter: timerConfig.amrapRounds && timerConfig.amrapRounds.length > 0
                        ? timerConfig.amrapRounds[0].rest * 60
                        : 0
                })

                // Sessions supplémentaires
                if (timerConfig.amrapRounds) {
                    timerConfig.amrapRounds.forEach((round: AMRAPRound, index: number) => {
                        sessions.push({
                            config: { duration: round.duration },
                            restAfter: index < timerConfig.amrapRounds!.length - 1
                                ? timerConfig.amrapRounds![index + 1].rest * 60
                                : 0
                        })
                    })
                }
                break

            case 'EMOM':
                // Session principale
                sessions.push({
                    config: {
                        duration: timerConfig.duration,
                        intervalMinutes: timerConfig.intervalMinutes,
                        isDeathBy: timerConfig.isDeathBy
                    },
                    restAfter: timerConfig.emomRound ? timerConfig.emomRound.rest * 60 : 0
                })

                // Session supplémentaire si configurée
                if (timerConfig.emomRound) {
                    sessions.push({
                        config: {
                            rounds: timerConfig.emomRound.round,
                            intervalMinutes: timerConfig.intervalMinutes,
                            isDeathBy: timerConfig.isDeathBy
                        },
                        restAfter: 0
                    })
                }
                break

            case 'FOR_TIME':
                // Session principale
                sessions.push({
                    config: {
                        timeCap: timerConfig.timeCap,
                        noTimeCap: timerConfig.noTimeCap
                    },
                    restAfter: 0
                })
                break

            default:
                sessions.push({
                    config: timerConfig,
                    restAfter: 0
                })
        }

        return sessions
    }

    const sessions = getSessions()
    const currentSession = sessions[currentSessionIndex]
    const totalSessions = sessions.length

    // Gérer le timer de récupération
    useEffect(() => {
        if (!isResting || restTimeRemaining <= 0) return

        const interval = setInterval(() => {
            setRestTimeRemaining(prev => {
                const newTime = prev - 1
                // Mettre à jour le temps affiché
                const minutes = Math.floor(newTime / 60)
                const seconds = newTime % 60
                onTimeUpdate?.(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)

                if (newTime <= 0) {
                    setIsResting(false)
                    setCurrentSessionIndex(prevIndex => prevIndex + 1)
                    return 0
                }
                return newTime
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [isResting, restTimeRemaining, onTimeUpdate])

    // Callback quand une session est terminée
    const handleSessionComplete = () => {
        const nextSessionIndex = currentSessionIndex + 1

        if (nextSessionIndex >= totalSessions) {
            // Toutes les sessions sont terminées
            onAllComplete?.()
            return
        }

        // Temps de récupération avant la prochaine session
        const restTime = currentSession.restAfter

        if (restTime > 0) {
            setRestTimeRemaining(restTime)
            setIsResting(true)
        } else {
            setCurrentSessionIndex(nextSessionIndex)
        }
    }

    // Afficher l'écran de récupération
    if (isResting) {
        const minutes = Math.floor(restTimeRemaining / 60)
        const seconds = restTimeRemaining % 60

        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="text-sm text-muted-foreground">
                    Session {currentSessionIndex + 1} de {totalSessions} terminée ✓
                </div>
                <div className="text-7xl font-bold tabular-nums text-primary">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <div className="text-xl font-medium">
                    Récupération
                </div>
                <div className="text-sm text-muted-foreground mt-4">
                    Prochaine session : {currentSessionIndex + 2}/{totalSessions}
                </div>
            </div>
        )
    }

    // Afficher le timer de la session actuelle
    return (
        <div className="space-y-2">
            {totalSessions > 1 && (
                <div className="text-center pb-2">
                    <div className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-md">
                        <span className="text-sm font-bold">
                            Session {currentSessionIndex + 1} / {totalSessions}
                        </span>
                    </div>
                </div>
            )}
            <div>
                {renderTimer(currentSession.config, handleSessionComplete, onTimeUpdate)}
            </div>
        </div>
    )
}
