'use client'

import { workoutsService } from "@/services"
import { Workouts } from "@/domain/entities/workout"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function BenchmarksContent() {
    const [benchmarkWorkouts, setBenchmarkWorkouts] = useState<Workouts[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBenchmarkWorkouts = async () => {
            try {
                setLoading(true)
                const { rows } = await workoutsService.getBenchmarkWorkouts()
                setBenchmarkWorkouts(rows)
            } catch {
                toast.error('Erreur lors de la récupération des benchmarks')
            } finally {
                setLoading(false)
            }
        }

        fetchBenchmarkWorkouts()
    }, [])

    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty) {
            case 'beginner':
                return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'intermediate':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            case 'advanced':
                return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
            case 'elite':
                return 'bg-red-500/10 text-red-500 border-red-500/20'
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }

    const getDifficultyLabel = (difficulty?: string) => {
        switch (difficulty) {
            case 'beginner':
                return 'Débutant'
            case 'intermediate':
                return 'Intermédiaire'
            case 'advanced':
                return 'Avancé'
            case 'elite':
                return 'Elite'
            default:
                return difficulty
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto p-6 max-w-7xl">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border mb-8">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                    <div className="relative p-8 md:p-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-5xl">🏆</div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                    Benchmarks
                                </h1>
                                <p className="text-muted-foreground mt-2">
                                    Évaluez votre niveau et suivez votre progression
                                </p>
                            </div>
                        </div>

                        {/* Stats rapides */}
                        <div className="flex flex-wrap gap-4 mt-6">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 backdrop-blur">
                                <span className="text-2xl">📊</span>
                                <div>
                                    <div className="text-xs text-muted-foreground">Benchmarks</div>
                                    <div className="font-bold">{benchmarkWorkouts.length} disponibles</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 backdrop-blur">
                                <span className="text-2xl">🎯</span>
                                <div>
                                    <div className="text-xs text-muted-foreground">Objectif</div>
                                    <div className="font-bold">Évaluation niveau</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Explication */}
                <div className="mb-8 grid md:grid-cols-3 gap-4">
                    <div className="p-6 rounded-xl bg-card border hover:border-primary/50 transition-all">
                        <div className="text-3xl mb-3">1️⃣</div>
                        <h3 className="font-semibold mb-2">Choisissez un benchmark</h3>
                        <p className="text-sm text-muted-foreground">
                            Sélectionnez un workout de référence adapté à votre niveau actuel
                        </p>
                    </div>
                    <div className="p-6 rounded-xl bg-card border hover:border-primary/50 transition-all">
                        <div className="text-3xl mb-3">2️⃣</div>
                        <h3 className="font-semibold mb-2">Effectuez le test</h3>
                        <p className="text-sm text-muted-foreground">
                            Complétez le workout et enregistrez votre performance (temps, rounds, poids...)
                        </p>
                    </div>
                    <div className="p-6 rounded-xl bg-card border hover:border-primary/50 transition-all">
                        <div className="text-3xl mb-3">3️⃣</div>
                        <h3 className="font-semibold mb-2">Découvrez votre niveau</h3>
                        <p className="text-sm text-muted-foreground">
                            Votre niveau sera calculé automatiquement selon les standards
                        </p>
                    </div>
                </div>

                {/* Benchmarks List */}
                {benchmarkWorkouts.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-2xl border">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-xl font-semibold mb-2">Aucun benchmark disponible</p>
                        <p className="text-muted-foreground">
                            Aucun workout de référence n'est encore disponible
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span>Workouts de référence</span>
                            <span className="text-sm font-normal text-muted-foreground">
                                ({benchmarkWorkouts.length})
                            </span>
                        </h2>

                        {benchmarkWorkouts.map((workout) => (
                            <Link
                                key={workout.id}
                                href={`/workout/${workout.id}`}
                                className="block group"
                            >
                                <div className="bg-card rounded-xl border hover:border-primary/50 transition-all overflow-hidden hover:shadow-xl p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                                                    {workout.name}
                                                </h3>
                                            </div>
                                            <p className="text-muted-foreground mb-3">
                                                {workout.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        {/* Type */}
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                                            <span className="text-lg">💪</span>
                                            <span className="text-xs font-medium uppercase tracking-wide">
                                                {workout.workout_type?.replace('_', ' ')}
                                            </span>
                                        </div>

                                        {/* Difficulty */}
                                        {workout.difficulty && (
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getDifficultyColor(workout.difficulty)}`}>
                                                <span className="text-xs font-semibold">
                                                    {getDifficultyLabel(workout.difficulty)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Duration */}
                                        {workout.estimated_duration && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
                                                <span className="text-lg">⏱️</span>
                                                <span className="text-xs font-semibold">
                                                    {workout.estimated_duration} min
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Coach Notes Preview */}
                                    {workout.coach_notes && (
                                        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-muted">
                                            <span className="text-lg shrink-0">💡</span>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {workout.coach_notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* CTA */}
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>Cliquez pour voir les détails</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                                            <span>Commencer</span>
                                            <span className="text-xl">→</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Bottom Info */}
                {benchmarkWorkouts.length > 0 && (
                    <div className="mt-12 p-8 bg-gradient-to-r from-primary/5 to-background border rounded-2xl">
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">📈</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-3">Suivez votre progression</h3>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex gap-2">
                                        <span className="text-primary shrink-0">✓</span>
                                        <span className="text-muted-foreground">
                                            Refaites régulièrement les mêmes benchmarks pour mesurer vos progrès
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-primary shrink-0">✓</span>
                                        <span className="text-muted-foreground">
                                            Comparez vos performances avec les standards
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-primary shrink-0">✓</span>
                                        <span className="text-muted-foreground">
                                            Votre niveau s'ajuste automatiquement selon vos résultats
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-primary shrink-0">✓</span>
                                        <span className="text-muted-foreground">
                                            Débloquez de nouveaux objectifs en progressant
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
