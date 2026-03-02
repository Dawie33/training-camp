'use client'

import { workoutsService } from "@/services"
import { Workouts } from "@/domain/entities/workout"
import { fadeInUp, staggerContainer } from "@/lib/animations"
import { motion } from "framer-motion"
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
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
            </div>
        )
    }

    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
        >
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Hero Section */}
                <motion.div
                    variants={fadeInUp}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 to-rose-500/20 backdrop-blur-xl border border-white/10"
                >
                    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                    <div className="relative p-8 md:p-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-5xl">🏆</div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold">
                                    <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Benchmarks</span>
                                </h1>
                                <p className="text-slate-400 mt-2">
                                    Évaluez votre niveau et suivez votre progression
                                </p>
                            </div>
                        </div>

                        {/* Stats rapides */}
                        <div className="flex flex-wrap gap-4 mt-6">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur border border-white/10">
                                <span className="text-2xl">📊</span>
                                <div>
                                    <div className="text-xs text-slate-400">Benchmarks</div>
                                    <div className="font-bold text-white">{benchmarkWorkouts.length} disponibles</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur border border-white/10">
                                <span className="text-2xl">🎯</span>
                                <div>
                                    <div className="text-xs text-slate-400">Objectif</div>
                                    <div className="font-bold text-white">Évaluation niveau</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Explication */}
                <motion.div variants={fadeInUp} className="grid md:grid-cols-3 gap-4">
                    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all">
                        <div className="text-3xl mb-3">1️⃣</div>
                        <h3 className="font-semibold mb-2 text-white">Choisissez un benchmark</h3>
                        <p className="text-sm text-slate-400">
                            Sélectionnez un workout de référence adapté à votre niveau actuel
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all">
                        <div className="text-3xl mb-3">2️⃣</div>
                        <h3 className="font-semibold mb-2 text-white">Effectuez le test</h3>
                        <p className="text-sm text-slate-400">
                            Complétez le workout et enregistrez votre performance (temps, rounds, poids...)
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all">
                        <div className="text-3xl mb-3">3️⃣</div>
                        <h3 className="font-semibold mb-2 text-white">Découvrez votre niveau</h3>
                        <p className="text-sm text-slate-400">
                            Votre niveau sera calculé automatiquement selon les standards
                        </p>
                    </div>
                </motion.div>

                {/* Benchmarks List */}
                {benchmarkWorkouts.length === 0 ? (
                    <motion.div variants={fadeInUp} className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-xl font-semibold mb-2 text-white">Aucun benchmark disponible</p>
                        <p className="text-slate-400">
                            Aucun workout de référence n'est encore disponible
                        </p>
                    </motion.div>
                ) : (
                    <motion.div variants={fadeInUp} className="space-y-4">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                            <span>Workouts de référence</span>
                            <span className="text-sm font-normal text-slate-400">
                                ({benchmarkWorkouts.length})
                            </span>
                        </h2>

                        {benchmarkWorkouts.map((workout) => (
                            <Link
                                key={workout.id}
                                href={`/workout/${workout.id}`}
                                className="block group"
                            >
                                <motion.div
                                    className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/30 transition-all overflow-hidden p-6"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors">
                                                    {workout.name}
                                                </h3>
                                            </div>
                                            <p className="text-slate-400 mb-3">
                                                {workout.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        {/* Type */}
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">
                                            <span className="text-lg">💪</span>
                                            <span className="text-xs font-medium uppercase tracking-wide text-slate-300">
                                                {workout.workout_type?.replace('_', ' ')}
                                            </span>
                                        </div>

                                        {/* Difficulty */}
                                        {workout.difficulty && (
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getDifficultyColor(workout.difficulty)}`}>
                                                <span className="text-xs font-semibold">
                                                    {getDifficultyLabel(workout.difficulty)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Duration */}
                                        {workout.estimated_duration && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                                <span className="text-lg">⏱️</span>
                                                <span className="text-xs font-semibold">
                                                    {workout.estimated_duration} min
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Coach Notes Preview */}
                                    {workout.coach_notes && (
                                        <div className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                                            <span className="text-lg shrink-0">💡</span>
                                            <p className="text-sm text-slate-400 line-clamp-2">
                                                {workout.coach_notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* CTA */}
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span>Cliquez pour voir les détails</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-orange-400 font-semibold group-hover:gap-3 transition-all">
                                            <span>Commencer</span>
                                            <span className="text-xl">→</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </motion.div>
                )}

                {/* Bottom Info */}
                {benchmarkWorkouts.length > 0 && (
                    <motion.div variants={fadeInUp} className="mt-8 p-8 bg-gradient-to-r from-orange-500/10 to-rose-500/10 backdrop-blur-xl border border-white/10 rounded-2xl">
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">📈</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-3 text-white">Suivez votre progression</h3>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex gap-2">
                                        <span className="text-orange-400 shrink-0">✓</span>
                                        <span className="text-slate-400">
                                            Refaites régulièrement les mêmes benchmarks pour mesurer vos progrès
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-orange-400 shrink-0">✓</span>
                                        <span className="text-slate-400">
                                            Comparez vos performances avec les standards
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-orange-400 shrink-0">✓</span>
                                        <span className="text-slate-400">
                                            Votre niveau s'ajuste automatiquement selon vos résultats
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-orange-400 shrink-0">✓</span>
                                        <span className="text-slate-400">
                                            Débloquez de nouveaux objectifs en progressant
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
