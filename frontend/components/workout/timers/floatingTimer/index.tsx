'use client'

import { useWorkoutTimer } from "@/hooks/useWorkoutTimer"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Timer } from "../../Timer"
import { AMRAPTimer } from "../AMRAPTimer"
import { EMOMTimer } from "../EMOMTimer"
import { ForTimeTimer } from "../ForTimeTimer"
import { TabataTimer } from "../TabataTimer"
import { MultiRoundTimer } from "../MultiRoundTimer"
import { BadgeView } from "./BadgeView"
import { ConfigView } from "./ConfigView"
import { MenuView } from "./MenuView"
import { RunningView } from "./RunningView"
import { MinimizedView } from "./MinimizedView"
import { TimerConfig } from "@/hooks/useWorkoutTimer"

export function FloatingTimer() {
    const { state, timerType, timerConfig, openMenu, selectTimerType, startTimer, closeTimer, goBackToMenu, stopTimer, minimizeTimer, maximizeTimer } = useWorkoutTimer()
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
    const [key, setKey] = useState(0)
    const [currentTime, setCurrentTime] = useState('00:00')
    const isInitialized = useRef(false)
    const previousState = useRef<string>('badge')

    // Gérer le resize et initialiser les dimensions
    useEffect(() => {
        const updateSize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            })
            isInitialized.current = true
        }

        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    // Réinitialiser la position quand on revient au badge ou centrer quand on ouvre
    useEffect(() => {
        if (isInitialized.current) {
            // Si on passe de 'badge' à autre chose, on réinitialise pour centrer
            if (previousState.current === 'badge' && state !== 'badge') {
                setKey(prev => prev + 1)
            }
            // Si on revient au badge, on réinitialise pour le mettre en bas à droite
            else if (state === 'badge' && previousState.current !== 'badge') {
                setKey(prev => prev + 1)
            }
            previousState.current = state
        }
    }, [state])

    if (windowSize.width === 0) return null

    // Calculer la position initiale selon l'état
    const getInitialPosition = () => {
        if (state === 'badge') {
            // Badge en bas à droite
            return { x: windowSize.width - 100, y: windowSize.height - 100 }
        } else {
            // Menu, Config, Running au centre de l'écran
            return { x: (windowSize.width - 350) / 2, y: (windowSize.height - 400) / 2 }
        }
    }

    // Fonction pour rendre un timer individuel avec son callback onComplete
    const renderSingleTimer = (config: TimerConfig, onComplete: () => void, onTimeUpdate?: (time: string) => void) => {
        if (!timerType) return null

        switch (timerType) {
            case 'TABATA':
                return <TabataTimer
                    rounds={config.rounds}
                    workSeconds={config.workSeconds}
                    restSeconds={config.restSeconds}
                    onComplete={onComplete}
                    onTimeUpdate={onTimeUpdate}
                />
            case 'AMRAP':
                return <AMRAPTimer
                    duration={config.duration ?? 20}
                    onComplete={onComplete}
                    onTimeUpdate={onTimeUpdate}
                />
            case 'EMOM':
                return <EMOMTimer
                    durationMin={config.duration ?? 10}
                    intervalMin={config.intervalMinutes ?? 1}
                    onComplete={onComplete}
                    onTimeUpdate={onTimeUpdate}
                />
            case 'FOR_TIME':
                return <ForTimeTimer
                    capMin={config.timeCap}
                    onComplete={onComplete}
                    onTimeUpdate={onTimeUpdate}
                />
            default:
                return null
        }
    }

    // Rendre le timer actif avec gestion des sessions multiples
    const renderActiveTimer = () => {
        if (!timerType) return null

        return (
            <MultiRoundTimer
                timerType={timerType}
                timerConfig={timerConfig}
                renderTimer={renderSingleTimer}
                onTimeUpdate={setCurrentTime}
            />
        )
    }

    return (
        <motion.div
            key={key}
            drag={state !== 'badge'}
            dragMomentum={false}
            dragElastic={0.1}
            dragConstraints={{
                top: 0,
                left: 0,
                right: windowSize.width - 350,
                bottom: windowSize.height - 100
            }}
            initial={getInitialPosition()}
            className="fixed top-0 left-0 z-[9999]"
        >
            <AnimatePresence mode="wait">
                {state === 'badge' && (
                    <BadgeView onClick={openMenu} />
                )}

                {state === 'menu' && (
                    <MenuView
                        onSelectType={selectTimerType}
                        onClose={closeTimer}
                    />
                )}

                {state === 'config' && timerType && (
                    <ConfigView
                        timerType={timerType}
                        onStart={startTimer}
                        onBack={goBackToMenu}
                        onClose={closeTimer}
                    />
                )}

                {(state === 'running' || state === 'minimized') && (
                    <>
                        {state === 'running' ? (
                            <RunningView
                                onClose={stopTimer}
                                onMinimize={minimizeTimer}
                            >
                                {renderActiveTimer()}
                            </RunningView>
                        ) : (
                            <MinimizedView
                                onClick={maximizeTimer}
                                currentTime={currentTime}
                            />
                        )}
                        {/* Timer caché mais toujours monté pour continuer à tourner */}
                        {state === 'minimized' && (
                            <div className="hidden">
                                {renderActiveTimer()}
                            </div>
                        )}
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
