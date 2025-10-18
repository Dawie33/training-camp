'use client'

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { SportCarousel } from "@/components/sport/SportCarousel"
import { useSport } from "@/contexts/SportContext"
import { useAllSports } from "@/hooks/useAllSports"
import { workoutsService } from "@/lib/api"
import { Sport } from "@/lib/types/sport"
import { Workouts } from "@/lib/types/workout"
import Link from "next/link"
import { useCallback, useEffect, useState } from 'react'
import { toast } from "sonner"
import { WorkoutFilters, WorkoutFiltersState } from "./_components/WorkoutFilters"
import { WorkoutGrid } from "./_components/WorkoutGrid"

const ITEMS_PER_PAGE = 12

/**
 * Page d'exploration des workouts
 * Permet de parcourir et filtrer les workouts par sport, difficulté, intensité, etc.
 */
function ExploreContent() {
    const { activeSport, setActiveSport } = useSport()
    const { sports: allSports, loading, error } = useAllSports()
    const [selectedSportForDetails, setSelectedSportForDetails] = useState<Sport | null>(null)

    // État des workouts
    const [workouts, setWorkouts] = useState<Workouts[]>([])
    const [loadingWorkouts, setLoadingWorkouts] = useState(false)
    const [totalWorkouts, setTotalWorkouts] = useState(0)

    // État des filtres et pagination
    const [filters, setFilters] = useState<WorkoutFiltersState>({
        search: '',
        difficulty: [],
        intensity: [],
    })
    const [currentPage, setCurrentPage] = useState(1)

    // Sélectionner automatiquement le sport actif ou le premier sport au chargement
    useEffect(() => {
        if (allSports.length > 0 && !selectedSportForDetails) {
            // Si on a un sport actif, l'utiliser, sinon prendre le premier
            const sportToSelect = activeSport || allSports[0]
            setSelectedSportForDetails(sportToSelect)

            // Si on n'avait pas de sport actif, définir le premier comme actif
            if (!activeSport) {
                setActiveSport(sportToSelect)
            }
        }
    }, [allSports, selectedSportForDetails, activeSport, setActiveSport])

    // Gérer la sélection d'un sport
    const handleSportSelect = (sport: Sport) => {
        if (selectedSportForDetails?.id === sport.id) {
            setSelectedSportForDetails(null)
        } else {
            setSelectedSportForDetails(sport)
            setActiveSport(sport)
        }
        // Réinitialiser la pagination quand on change de sport
        setCurrentPage(1)
    }

    // Récupérer les workouts
    const fetchWorkouts = useCallback(async () => {
        if (!selectedSportForDetails) return

        try {
            setLoadingWorkouts(true)

            const { rows, count } = await workoutsService.getAll({
                sport_id: selectedSportForDetails.id,
                search: filters.search || undefined,
                difficulty: filters.difficulty.length > 0 ? filters.difficulty.join(',') : undefined,
                intensity: filters.intensity.length > 0 ? filters.intensity.join(',') : undefined,
                min_duration: filters.minDuration,
                max_duration: filters.maxDuration,
                limit: ITEMS_PER_PAGE,
                offset: (currentPage - 1) * ITEMS_PER_PAGE,
            })

            setWorkouts(rows)
            setTotalWorkouts(count)
        } catch {
            toast.error('Erreur lors du chargement des workouts')
        } finally {
            setLoadingWorkouts(false)
        }
    }, [selectedSportForDetails, filters, currentPage])

    useEffect(() => {
        fetchWorkouts()
    }, [fetchWorkouts])

    // Réinitialiser la page quand les filtres changent
    const handleFiltersChange = (newFilters: WorkoutFiltersState) => {
        setFilters(newFilters)
        setCurrentPage(1)
    }



    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500">Erreur: {error}</div>
            </div>
        )
    }

    // Afficher un message si aucun sport n'est disponible
    if (!activeSport && allSports.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold">Aucun sport disponible</h2>
                    <p className="text-muted-foreground">Complète ton profil pour commencer</p>
                    <Link
                        href="/onboarding"
                        className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        Compléter mon profil
                    </Link>
                </div>
            </div>
        )
    }

    const totalPages = Math.ceil(totalWorkouts / ITEMS_PER_PAGE)

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Carousel de sports */}
                <section>
                    <SportCarousel
                        sports={allSports}
                        selectedSportId={selectedSportForDetails?.id || activeSport?.id}
                        onSportSelect={handleSportSelect}
                        title="Explorer les workouts"
                        description="Sélectionnez un sport et découvrez tous les workouts disponibles"
                        variant="default"
                    />
                </section>

                {/* Section workouts */}
                {selectedSportForDetails && (
                    <section className="space-y-6 animate-in fade-in duration-500">
                        {/* En-tête avec nombre de résultats */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedSportForDetails.name}</h2>
                                <p className="text-muted-foreground">
                                    {totalWorkouts} workout{totalWorkouts > 1 ? 's' : ''} disponible{totalWorkouts > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Filtres */}
                        <WorkoutFilters
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                        />

                        {/* Grille de workouts */}
                        <WorkoutGrid
                            workouts={workouts}
                            loading={loadingWorkouts}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalWorkouts={totalWorkouts}
                            onPageChange={setCurrentPage}
                        />
                    </section>
                )}
            </div>
        </div>
    )
}

export default function ExplorePage() {
    return (
        <ProtectedRoute>
            <ExploreContent />
        </ProtectedRoute>
    )
}

