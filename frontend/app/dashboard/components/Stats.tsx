import { useSport } from "@/contexts/SportContext"
import { usersService } from "@/lib/api/users"
import { User } from "@/lib/types/auth"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

/**
 * Affiche les statistiques de l'utilisateur (nombre de workout complétés, temps total et niveau)
 * Version compacte en ligne pour une meilleure utilisation de l'espace
 * @returns Un composant affichant les statistiques de l'utilisateur
 */
export function Stats() {
    const { activeSport } = useSport()
    const [user, setUser] = useState<User | null>(null)

    const fetchUserProfile = useCallback(async () => {
        const response = await usersService.getUserProfile(activeSport?.id)
        setUser(response)
    }, [activeSport])

    useEffect(() => {
        fetchUserProfile()
    }, [fetchUserProfile])

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-lg p-6 border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Sessions complétées</h3>
                        <p className="text-3xl font-bold">{user?.stats?.sessions || 0}</p>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-lg p-6 border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Temps total</h3>
                        <p className="text-3xl font-bold">
                            {user?.stats?.total_time_minutes
                                ? user.stats.total_time_minutes >= 60
                                    ? `${Math.floor(user.stats.total_time_minutes / 60)}h${user.stats.total_time_minutes % 60 > 0 ? ` ${user.stats.total_time_minutes % 60}min` : ''}`
                                    : `${user.stats.total_time_minutes}min`
                                : '0min'
                            }
                        </p>
                    </div>
                </div>
            </div>
            <Link key={user?.id} href={`/benchmarks`} className="block group">
                <div className="bg-card rounded-lg p-6 border hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-muted-foreground">Niveau</h3>
                            <p className="text-3xl font-bold">
                                {user?.sport_level === 'beginner' && 'Débutant'}
                                {user?.sport_level === 'intermediate' && 'Intermédiaire'}
                                {user?.sport_level === 'advanced' && 'Avancé'}
                                {user?.sport_level === 'elite' && 'Elite'}
                                {!user?.sport_level && 'Débutant'}
                            </p>
                        </div>
                    </div>
                </div>
            </Link >
        </div >
    )
}