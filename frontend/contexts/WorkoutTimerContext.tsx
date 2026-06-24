'use client'

import { useCallback, useMemo, useState } from 'react'
import { TimerConfig, TimerState, TimerType, WorkoutTimerContext } from '../hooks/useWorkoutTimer'

/**
* Un fournisseur pour le contexte WorkoutTimerContext, qui gère l'état d'un
* minuteur d'entraînement et fournit des fonctions pour mettre à jour cet état.
*
* @param {React.ReactNode} children - Les enfants du fournisseur
* @returns {JSX.Element} - L'élément fournisseur
 */

export function WorkoutTimerProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<TimerState>('badge')
    const [timerType, setTimerType] = useState<TimerType | null>(null)
    const [timerConfig, setTimerConfig] = useState<TimerConfig>({})

    const openMenu = useCallback(() => setState('menu'), [])

    const selectTimerType = useCallback((type: TimerType) => {
        setTimerType(type)
        setState('config')
    }, [])

    const startTimer = useCallback((config: TimerConfig) => {
        setTimerConfig(config)
        setState('running')
    }, [])

    const stopTimer = useCallback(() => {
        setState('badge')
        setTimerType(null)
        setTimerConfig({})
    }, [])

    const closeTimer = useCallback(() => {
        setState('badge')
        setTimerType(null)
        setTimerConfig({})
    }, [])

    const goBackToMenu = useCallback(() => {
        setState('menu')
        setTimerType(null)
    }, [])

    const minimizeTimer = useCallback(() => setState('minimized'), [])

    const maximizeTimer = useCallback(() => setState('running'), [])

    const value = useMemo(() => ({
        state,
        timerType,
        timerConfig,
        openMenu,
        selectTimerType,
        startTimer,
        stopTimer,
        closeTimer,
        goBackToMenu,
        minimizeTimer,
        maximizeTimer,
    }), [state, timerType, timerConfig, openMenu, selectTimerType, startTimer, stopTimer, closeTimer, goBackToMenu, minimizeTimer, maximizeTimer])

    return (
        <WorkoutTimerContext.Provider value={value}>
            {children}
        </WorkoutTimerContext.Provider>
    )
}

