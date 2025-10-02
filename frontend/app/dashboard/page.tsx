'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { sportsService } from '@/lib/api'
import type { Sport } from '@/lib/types/sport'
import { useEffect, useState } from 'react'

function DashboardContent() {
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    /**
     * Récupération de la liste des sports.
     * @returns A promise that resolves to an object containing the rows and count.
     */
    const fetchSports = async () => {
      try {
        setLoading(true)
        const { rows: response } = await sportsService.getAll()
        setSports(response)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur dans la récupération des sports')
      } finally {
        setLoading(false)
      }
    }

    fetchSports()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading sports...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Sports Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sports.map((sport) => (
          <div
            key={sport.id}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              {sport.icon && <span className="text-2xl">{sport.icon}</span>}
              <h2 className="text-xl font-semibold">{sport.name}</h2>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              {sport.description || 'No description'}
            </p>

            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 bg-primary/10 rounded">
                {sport.category}
              </span>
              {sport.requires_premium && (
                <span className="text-xs px-2 py-1 bg-yellow-500/10 rounded">
                  Premium
                </span>
              )}
              {!sport.isActive && (
                <span className="text-xs px-2 py-1 bg-red-500/10 rounded">
                  Inactive
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {sports.length === 0 && (
        <div className="text-center text-muted-foreground mt-8">
          No sports found
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
