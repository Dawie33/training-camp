'use client'

import { useCallback, useEffect, useRef } from 'react'

type TimeoutId = ReturnType<typeof setTimeout>

/**
 * Hook pour gérer les effets sonores des timers
 * Utilise l'API Web Audio pour générer des sons
 */
export function useTimerSounds() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const timeoutsRef = useRef<TimeoutId[]>([])

  const scheduleTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay)
    timeoutsRef.current.push(id)
    return id
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
      audioContextRef.current?.close()
    }
  }, [])

  const playBeep = useCallback((frequency: number = 800, duration: number = 100) => {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)
  }, [])

  // Son de compte à rebours (bip court)
  const playCountdownBeep = useCallback(() => playBeep(600, 100), [playBeep])

  // Son de démarrage (bip montant)
  const playStartSound = useCallback(() => {
    playBeep(400, 100)
    scheduleTimeout(() => playBeep(600, 100), 100)
    scheduleTimeout(() => playBeep(800, 150), 200)
  }, [playBeep, scheduleTimeout])

  const playFinishSound = useCallback(() => {
    playBeep(1000, 200)
    scheduleTimeout(() => playBeep(1200, 300), 250)
  }, [playBeep, scheduleTimeout])

  const playAlertSound = useCallback(() => {
    playBeep(900, 150)
    scheduleTimeout(() => playBeep(900, 150), 200)
  }, [playBeep, scheduleTimeout])

  const playWorkSound = useCallback(() => {
    playBeep(800, 200)
    scheduleTimeout(() => playBeep(1000, 200), 250)
  }, [playBeep, scheduleTimeout])

  const playRestSound = useCallback(() => {
    playBeep(400, 300)
  }, [playBeep])

  const playRoundSound = useCallback(() => {
    playBeep(700, 150)
    scheduleTimeout(() => playBeep(700, 150), 200)
    scheduleTimeout(() => playBeep(900, 200), 400)
  }, [playBeep, scheduleTimeout])

  return {
    playCountdownBeep,
    playStartSound,
    playFinishSound,
    playAlertSound,
    playWorkSound,
    playRestSound,
    playRoundSound
  }
}
