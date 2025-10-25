'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { workoutsService } from '@/lib/api'
import { Workouts } from '@/lib/types/workout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { WorkoutFilters, WorkoutFiltersState } from '../explore/_components/WorkoutFilters'
import { WorkoutGrid } from '../explore/_components/WorkoutGrid'

const ITEMS_PER_PAGE = 12
function PersonalizedWorkoutsContent() {
    const [workouts, setWorkouts] = useState<Workouts[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalWorkouts, setTotalWorkouts] = useState(0)
    // État des filtres et pagination
    const [filters, setFilters] = useState<WorkoutFiltersState>({
        search: '',
        difficulty: [],
        intensity: [],
        minDuration: undefined,
        maxDuration: undefined
    })

    useEffect(() => {
        const fetchPersonalizedWorkouts = async () => {
            try {
                setLoading(true)
                const offset = (currentPage - 1) * ITEMS_PER_PAGE

                // Convertir les tableaux de filtres en strings pour l'API
                const difficulty = filters.difficulty.length > 0 ? filters.difficulty[0] : undefined
                const intensity = filters.intensity.length > 0 ? filters.intensity[0] : undefined
                const minDuration = filters.minDuration || undefined
                const maxDuration = filters.maxDuration || undefined
                const search = filters.search || undefined

                const response = await workoutsService.getPersonalizedWorkouts(
                    ITEMS_PER_PAGE,
                    offset,
                    search || undefined,
                    difficulty,
                    intensity,
                    minDuration,
                    maxDuration
                )

                // Parser les workouts depuis plan_json
                const parsedWorkouts = response.rows.map((workout) => {
                    const parsedWorkout = typeof workout.plan_json === 'string'
                        ? JSON.parse(workout.plan_json)
                        : workout.plan_json
                    return {
                        ...parsedWorkout,
                        id: workout.id,
                    }
                })

                setWorkouts(parsedWorkouts)
                setTotalWorkouts(response.count)
            } catch (error) {
                toast.error(`Erreur lors du chargement des workouts personnalisés:${error}`)
            } finally {
                setLoading(false)
            }
        }

        fetchPersonalizedWorkouts()
    }, [currentPage, filters])

    // Réinitialiser la page quand les filtres changent
    const handleFiltersChange = (newFilters: WorkoutFiltersState) => {
        setFilters(newFilters)
        setCurrentPage(1)
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Chargement de vos workouts personnalisés...</p>
                </div>
            </div>
        )
    }

    const totalPages = Math.ceil(totalWorkouts / ITEMS_PER_PAGE)

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Back Button */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Retour au dashboard
            </Link>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Mes Workouts Personnalisés</h1>
                <p className="text-muted-foreground">
                    Retrouvez tous vos workouts personnalisés et modifiés
                </p>
            </div>

            {/* Workouts Grid */}
            {workouts.length === 0 ? (
                <div className="text-center py-12">
                    <div className="mb-4">
                        <svg
                            className="mx-auto h-12 w-12 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Aucun workout personnalisé</h3>
                    <p className="text-muted-foreground mb-6">
                        Vous n'avez pas encore créé de workout personnalisé.
                    </p>
                    <Link
                        href="/explore"
                        className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Explorer les workouts
                    </Link>
                </div>
            ) : (
                <div>
                    {/* Filtres */}
                    <div className='mb-6'>

                        <WorkoutFilters
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                        />
                    </div>
                    {/* Grid de workouts */}
                    <WorkoutGrid
                        workouts={workouts}
                        loading={loading}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalWorkouts={totalWorkouts}
                        onPageChange={setCurrentPage}
                        basePath="/personalized-workout"
                    />
                </div>
            )}
        </div>
    )
}

export default function PersonalizedWorkoutsPage() {
    return (
        <ProtectedRoute>
            <PersonalizedWorkoutsContent />
        </ProtectedRoute>
    )
}