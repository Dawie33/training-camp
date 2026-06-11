import { BIKE_TYPE_COLORS, BIKE_TYPE_LABELS, BikingSession, formatDuration } from '@/services/biking'
import { Bike, Clock, Flame, Heart, Zap } from 'lucide-react'

interface BikingSessionCardProps {
    session: BikingSession
}

export function BikingSessionCard({ session }: BikingSessionCardProps) {
    const typeColor = BIKE_TYPE_COLORS[session.bike_type]
    const typeLabel = BIKE_TYPE_LABELS[session.bike_type]
    const date = new Date(session.session_date).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    })

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                        <Bike className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white capitalize">
                            {session.ai_plan?.name ?? typeLabel}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{date}</p>
                    </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${typeColor}`}>
                    {typeLabel}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {session.duration_seconds && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDuration(session.duration_seconds)}</span>
                    </div>
                )}
                {session.avg_power_watts && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                        <span>{session.avg_power_watts}W moy.</span>
                    </div>
                )}
                {session.avg_heart_rate && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Heart className="w-3.5 h-3.5 text-red-400" />
                        <span>{session.avg_heart_rate} bpm</span>
                    </div>
                )}
                {session.calories && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span>{session.calories} kcal</span>
                    </div>
                )}
                {session.distance_km && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="font-medium text-slate-300">{session.distance_km} km</span>
                    </div>
                )}
            </div>

            {session.perceived_effort && (
                <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-500">Effort perçu</span>
                    <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-3 rounded-full ${i < session.perceived_effort! ? 'bg-blue-400' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-slate-400">{session.perceived_effort}/10</span>
                </div>
            )}

            {session.notes && (
                <p className="mt-2 text-xs text-slate-500 italic line-clamp-2">{session.notes}</p>
            )}
        </div>
    )
}
