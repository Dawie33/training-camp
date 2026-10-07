'use client'

import { apiClient } from '@/services/apiClient'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export type SportType = 'crossfit'

export interface TypeTrend {
  type: string
  trend: 'improving' | 'stable' | 'declining'
  detail: string
  session_count: number
}

export interface FitnessProfile {
  cardio: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  strength: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  work_capacity: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  endurance: 'beginner' | 'intermediate' | 'advanced' | 'elite'
}

export interface ProgressionReport {
  sport: SportType
  period_months: number
  period_summary: string
  overall_trend: 'improving' | 'stable' | 'declining'
  highlights: string[]
  type_trends: TypeTrend[]
  strengths: string[]
  weak_points: string[]
  recommendations: string[]
  consistency_feedback: string
  performance_highlights?: string[]
  strength_progression?: string
  movement_focus?: string[]
  fitness_profile?: FitnessProfile
  overall_fitness_level?: string
  generated_at: string
  /** Renvoyé par la génération seulement : vrai si le bilan enregistré était encore à jour */
  reused?: boolean
}

export function useProgressionReport() {
  const [report, setReport] = useState<ProgressionReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSaved() {
      try {
        const data = await apiClient.get<ProgressionReport | null>('/tracking/report/saved')
        if (data) setReport(data)
      } catch {
        // Pas de rapport sauvegardé, on laisse l'UI inviter à générer
      }
    }
    loadSaved()
  }, [])

  async function generate(months = 3) {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.post<ProgressionReport>(`/tracking/report?months=${months}`)
      setReport(data)
      if (data.reused) {
        toast.info('Bilan déjà à jour', {
          description: 'Aucune nouvelle séance, 1RM ou benchmark depuis le dernier bilan.',
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la génération du bilan')
    } finally {
      setLoading(false)
    }
  }

  return { report, loading, error, generate }
}
