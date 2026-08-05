import { formatDuration, formatPace, RUN_TYPE_LABELS, RunningSession } from '@/services/running'
import { Clock, MapPin, X } from 'lucide-react'

interface Props {
    session: RunningSession | null
    onClose: () => void
}

export function RunningSessionDetailModal({ session, onClose }: Props) {
    if (!session) return null

    const plan = session.ai_plan
    const typeLabel = RUN_TYPE_LABELS[session.run_type]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-card border border-border rounded-lg shadow-2xl overflow-y-auto max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
                    <div>
                        <h2 className="font-semibold text-foreground">{plan?.name ?? typeLabel}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(session.session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {' · '}
                            {typeLabel}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Tags infos mesurées */}
                    <div className="flex flex-wrap gap-2">
                        {session.duration_seconds && (
                            <span className="px-2 py-1 rounded-md text-xs bg-secondary text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatDuration(session.duration_seconds)}
                            </span>
                        )}
                        {session.distance_km && (
                            <span className="px-2 py-1 rounded-md text-xs bg-secondary text-muted-foreground">
                                {session.distance_km} km
                            </span>
                        )}
                        {session.avg_pace_seconds_per_km && (
                            <span className="px-2 py-1 rounded-md text-xs bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {formatPace(session.avg_pace_seconds_per_km)}
                            </span>
                        )}
                        {session.avg_heart_rate && (
                            <span className="px-2 py-1 rounded-md text-xs bg-secondary text-muted-foreground">
                                {session.avg_heart_rate} bpm
                            </span>
                        )}
                        {session.elevation_gain_m && (
                            <span className="px-2 py-1 rounded-md text-xs bg-secondary text-muted-foreground">
                                D+ {session.elevation_gain_m} m
                            </span>
                        )}
                        {session.calories && (
                            <span className="px-2 py-1 rounded-md text-xs bg-secondary text-muted-foreground">
                                {session.calories} kcal
                            </span>
                        )}
                        {session.perceived_effort && (
                            <span className="px-2 py-1 rounded-md text-xs bg-secondary text-muted-foreground">
                                Effort perçu {session.perceived_effort}/10
                            </span>
                        )}
                    </div>

                    {session.notes && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{session.notes}</p>
                    )}

                    {/* Plan IA détaillé */}
                    {plan && (
                        <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5" />
                                        {plan.estimated_duration_minutes} min
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {plan.total_distance_km} km
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {plan.structure.map((phase, i) => (
                                    <div key={i} className="flex gap-3 items-start">
                                        <div className="w-1 self-stretch rounded-full bg-primary/40 flex-shrink-0 mt-1" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-foreground">{phase.label}</span>
                                                <span className="text-xs text-muted-foreground">{phase.duration_minutes} min</span>
                                                <span className="text-xs text-primary font-medium">{phase.pace_description}</span>
                                            </div>
                                            {phase.intervals && phase.intervals.length > 0 && (
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {phase.intervals[0].repetitions}× {phase.intervals[0].effort_duration} @ {phase.intervals[0].pace_description} / {phase.intervals[0].recovery_duration} récup.
                                                </div>
                                            )}
                                            {phase.notes && <p className="mt-0.5 text-xs text-muted-foreground italic">{phase.notes}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="rounded-lg bg-card border border-border p-3 space-y-1">
                                    <p className="text-xs font-semibold text-foreground">Conseils coach</p>
                                    <p className="text-xs text-muted-foreground">{plan.coaching_tips}</p>
                                </div>
                                {plan.recovery_notes && (
                                    <div className="rounded-lg bg-card border border-border p-3 space-y-1">
                                        <p className="text-xs font-semibold text-foreground">Récupération</p>
                                        <p className="text-xs text-muted-foreground">{plan.recovery_notes}</p>
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
