import { BIKE_LOCATION_LABELS, BIKE_TYPE_LABELS, BikingSession, formatDuration } from '@/services/biking'
import { Clock, X, Zap } from 'lucide-react'

interface Props {
    session: BikingSession | null
    onClose: () => void
}

export function BikingSessionDetailModal({ session, onClose }: Props) {
    if (!session) return null

    const plan = session.ai_plan
    const typeLabel = BIKE_TYPE_LABELS[session.bike_type]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-slate-900 z-10">
                    <div>
                        <h2 className="font-semibold text-white">{plan?.name ?? typeLabel}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(session.session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {' · '}
                            {typeLabel}
                            {' · '}
                            {BIKE_LOCATION_LABELS[session.location_type]}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Tags infos mesurées */}
                    <div className="flex flex-wrap gap-2">
                        {session.duration_seconds && (
                            <span className="px-2 py-1 rounded-md text-xs bg-slate-700/50 text-slate-300 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatDuration(session.duration_seconds)}
                            </span>
                        )}
                        {session.distance_km && (
                            <span className="px-2 py-1 rounded-md text-xs bg-slate-700/50 text-slate-300">
                                {session.distance_km} km
                            </span>
                        )}
                        {session.avg_power_watts && (
                            <span className="px-2 py-1 rounded-md text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                <Zap className="w-3 h-3" /> {session.avg_power_watts}W moy.
                            </span>
                        )}
                        {session.avg_heart_rate && (
                            <span className="px-2 py-1 rounded-md text-xs bg-slate-700/50 text-slate-300">
                                {session.avg_heart_rate} bpm
                            </span>
                        )}
                        {session.calories && (
                            <span className="px-2 py-1 rounded-md text-xs bg-slate-700/50 text-slate-300">
                                {session.calories} kcal
                            </span>
                        )}
                        {session.perceived_effort && (
                            <span className="px-2 py-1 rounded-md text-xs bg-slate-700/50 text-slate-300">
                                Effort perçu {session.perceived_effort}/10
                            </span>
                        )}
                    </div>

                    {session.notes && (
                        <p className="text-sm text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">{session.notes}</p>
                    )}

                    {/* Plan IA détaillé */}
                    {plan && (
                        <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <p className="text-sm text-slate-400">{plan.description}</p>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        {plan.estimated_duration_minutes} min
                                    </span>
                                    {plan.tss_estimate && (
                                        <span className="flex items-center gap-1 text-xs text-slate-400">
                                            <Zap className="w-3.5 h-3.5" />
                                            TSS ~{plan.tss_estimate}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {plan.structure.map((block, i) => (
                                    <div key={i} className="flex gap-3 items-start">
                                        <div className="w-1 self-stretch rounded-full bg-blue-500/40 flex-shrink-0 mt-1" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-white">{block.label}</span>
                                                <span className="text-xs text-slate-400">{block.duration_minutes} min</span>
                                                <span className="text-xs text-blue-400 font-medium">{block.power_target}</span>
                                            </div>
                                            {block.intervals && block.intervals.length > 0 && (
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {block.intervals[0].repetitions}× {block.intervals[0].effort_duration} @ {block.intervals[0].power_description} / {block.intervals[0].recovery_duration} récup.
                                                </div>
                                            )}
                                            {block.notes && <p className="mt-0.5 text-xs text-slate-500 italic">{block.notes}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1">
                                    <p className="text-xs font-semibold text-slate-300">Conseils coach</p>
                                    <p className="text-xs text-slate-400">{plan.coaching_tips}</p>
                                </div>
                                {plan.recovery_notes && (
                                    <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1">
                                        <p className="text-xs font-semibold text-slate-300">Récupération</p>
                                        <p className="text-xs text-slate-400">{plan.recovery_notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
