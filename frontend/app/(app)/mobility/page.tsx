'use client'

import {
    formatDuration,
    GenerateMobilityDto,
    GeneratedMobilityPlan,
    MOBILITY_FOCUS_AREA_LABELS,
    MOBILITY_GOAL_LABELS,
    MOBILITY_PHASE_LABELS,
    MobilityFocusArea,
    MobilityGoal,
    mobilityService,
} from '@/services/mobility'
import { Clock, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const FOCUS_AREAS: MobilityFocusArea[] = ['hips', 'shoulders', 'hips_shoulders', 'wrists', 'ankles', 'thoracic_spine', 'full_body']
const GOALS: MobilityGoal[] = ['crossfit_technique', 'relaxation', 'recovery']

export default function MobilityPage() {
    const [form, setForm] = useState<GenerateMobilityDto>({
        focus_area: 'hips',
        goal: 'crossfit_technique',
        duration_minutes: 15,
    })
    const [plan, setPlan] = useState<GeneratedMobilityPlan | null>(null)
    const [generating, setGenerating] = useState(false)

    const set = (key: keyof GenerateMobilityDto, value: string | number | undefined) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const handleGenerate = async () => {
        setGenerating(true)
        setPlan(null)
        try {
            const result = await mobilityService.generate(form)
            setPlan(result)
        } catch {
            toast.error('Erreur lors de la génération. Réessaie.')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <div>
                <div className="eyebrow mb-3">Mobilité · plan IA à la demande</div>
                <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-none tracking-tight">Mobilité</h1>
                <p className="text-muted-foreground text-sm mt-3">Génère une routine de mobilité personnalisée (hanches, épaules, poignets, chevilles, technique...)</p>
            </div>

            <div className="space-y-6">
                {/* Formulaire */}
                <div className="rounded-lg border border-border bg-card p-5 space-y-5">
                    <h2 className="eyebrow">Paramètres de la séance</h2>

                    {/* Zone */}
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Zone ciblée</label>
                        <div className="grid grid-cols-2 gap-2">
                            {FOCUS_AREAS.map(area => (
                                <button
                                    key={area}
                                    type="button"
                                    onClick={() => set('focus_area', area)}
                                    className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${form.focus_area === area
                                        ? 'bg-primary/10 border-primary text-primary font-medium'
                                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {MOBILITY_FOCUS_AREA_LABELS[area]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Objectif */}
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Objectif</label>
                        <div className="grid grid-cols-3 gap-2">
                            {GOALS.map(goal => (
                                <button
                                    key={goal}
                                    type="button"
                                    onClick={() => set('goal', goal)}
                                    className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${form.goal === goal
                                        ? 'bg-primary/10 border-primary text-primary font-medium'
                                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {MOBILITY_GOAL_LABELS[goal]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Durée + Skill */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1.5">Durée (min)</label>
                            <input
                                type="number"
                                value={form.duration_minutes}
                                min={5}
                                max={90}
                                onChange={e => set('duration_minutes', Number(e.target.value))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1.5">Compétence ciblée (optionnel)</label>
                            <input
                                type="text"
                                placeholder="ex: overhead squat"
                                onChange={e => set('target_skill', e.target.value || undefined)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                    </div>

                    {/* Instructions additionnelles */}
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Instructions additionnelles (optionnel)</label>
                        <input
                            type="text"
                            placeholder="ex: douleur au genou droit, éviter les positions au sol..."
                            onChange={e => set('additional_instructions', e.target.value || undefined)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold text-sm transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        {generating ? 'Génération en cours...' : plan ? 'Régénérer' : 'Générer la séance'}
                    </button>
                </div>

                {/* Résultat */}
                {plan && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                            </div>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <Clock className="w-3.5 h-3.5" />
                                {plan.estimated_duration_minutes} min
                            </span>
                        </div>

                        {/* Structure */}
                        <div className="space-y-4">
                            {plan.structure.map((block, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                    <div className="w-1 self-stretch rounded-full bg-primary/40 flex-shrink-0 mt-1" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-semibold text-primary uppercase tracking-wide">{MOBILITY_PHASE_LABELS[block.phase]}</span>
                                            <span className="text-sm font-semibold text-foreground">{block.label}</span>
                                            <span className="text-xs text-muted-foreground">{block.duration_minutes} min</span>
                                        </div>
                                        <div className="mt-2 space-y-1.5">
                                            {block.drills.map((drill, j) => (
                                                <div key={j} className="rounded-md bg-card border border-border p-2">
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <span className="text-sm font-medium text-foreground">{drill.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDuration(drill.duration_seconds)} · {drill.side === 'bilateral' ? 'bilatéral' : 'gauche/droite'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{drill.target_area}{drill.equipment ? ` · ${drill.equipment}` : ''}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{drill.instructions}</p>
                                                    {drill.cues && <p className="text-xs text-muted-foreground italic mt-0.5">{drill.cues}</p>}
                                                </div>
                                            ))}
                                        </div>
                                        {block.notes && <p className="mt-1.5 text-xs text-muted-foreground italic">{block.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Conseils */}
                        <div className="rounded-lg bg-card border border-border p-3 space-y-1">
                            <p className="text-xs font-semibold text-foreground">Conseils coach</p>
                            <p className="text-xs text-muted-foreground">{plan.coaching_tips}</p>
                        </div>
                        {plan.relaxation_notes && (
                            <div className="rounded-lg bg-card border border-border p-3 space-y-1">
                                <p className="text-xs font-semibold text-foreground">Détente</p>
                                <p className="text-xs text-muted-foreground">{plan.relaxation_notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
