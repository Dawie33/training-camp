'use client'

import {
    formatDuration,
    GenerateMobilityDto,
    GeneratedMobilityPlan,
    MOBILITY_FOCUS_AREA_LABELS,
    MOBILITY_GOAL_LABELS,
    MOBILITY_PHASE_LABELS,
    MOBILITY_TARGET_SKILL_LABELS,
    MobilityFocusArea,
    MobilityGoal,
    MobilityTargetSkill,
    mobilityService,
} from '@/services/mobility'
import { Clock, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const FOCUS_AREAS: MobilityFocusArea[] = ['hips', 'shoulders', 'hips_shoulders', 'wrists', 'ankles', 'thoracic_spine', 'full_body']
const GOALS: MobilityGoal[] = ['crossfit_technique', 'relaxation', 'recovery']
const TARGET_SKILLS: MobilityTargetSkill[] = ['snatch', 'overhead_squat', 'clean', 'jerk', 'thruster', 'handstand_hspu']

export default function MobilityPage() {
    const searchParams = useSearchParams()

    const [form, setForm] = useState<GenerateMobilityDto>({
        goal: 'crossfit_technique',
        target_skill: 'snatch',
        duration_minutes: 15,
    })
    const [plan, setPlan] = useState<GeneratedMobilityPlan | null>(null)
    const [generating, setGenerating] = useState(false)

    // Pré-remplissage depuis le CTA "étirements de récupération" post-log (voir buildRecoveryMobilityUrl dans services/mobility.ts)
    useEffect(() => {
        const goal = searchParams.get('goal') as MobilityGoal | null
        if (!goal) return
        const focusArea = searchParams.get('focus_area') as MobilityFocusArea | null
        const additionalInstructions = searchParams.get('additional_instructions')
        const sourceSport = searchParams.get('source_sport')
        const sourceWorkoutType = searchParams.get('source_workout_type')
        const sourceFocusAreasText = searchParams.get('source_focus_areas_text')

        setForm(prev => ({
            ...prev,
            goal,
            focus_area: focusArea ?? undefined,
            target_skill: goal === 'crossfit_technique' ? prev.target_skill : undefined,
            additional_instructions: additionalInstructions ?? prev.additional_instructions,
            ...(sourceSport === 'crossfit' && {
                source_sport: 'crossfit' as const,
                source_workout_type: sourceWorkoutType ?? undefined,
                source_focus_areas_text: sourceFocusAreasText ? sourceFocusAreasText.split(',').filter(Boolean) : undefined,
            }),
        }))
    }, [searchParams])

    const set = (key: keyof GenerateMobilityDto, value: string | number | undefined) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const setGoal = (goal: MobilityGoal) =>
        setForm(prev => ({
            ...prev,
            goal,
            focus_area: goal === 'crossfit_technique' ? undefined : prev.focus_area || 'hips',
            target_skill: goal === 'crossfit_technique' ? prev.target_skill || 'snatch' : undefined,
            // Le contexte auto ne s'applique qu'à la récupération : on l'efface si l'utilisateur change d'objectif.
            source_sport: goal === 'recovery' ? prev.source_sport : undefined,
            source_workout_type: goal === 'recovery' ? prev.source_workout_type : undefined,
            source_focus_areas_text: goal === 'recovery' ? prev.source_focus_areas_text : undefined,
        }))

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

                    {/* Objectif */}
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Objectif</label>
                        <div className="grid grid-cols-3 gap-2">
                            {GOALS.map(goal => (
                                <button
                                    key={goal}
                                    type="button"
                                    onClick={() => setGoal(goal)}
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

                    {form.goal === 'crossfit_technique' ? (
                        /* Mouvement technique : les zones à travailler sont déduites par l'IA à partir du mouvement */
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1.5">Mouvement technique</label>
                            <div className="grid grid-cols-2 gap-2">
                                {TARGET_SKILLS.map(skill => (
                                    <button
                                        key={skill}
                                        type="button"
                                        onClick={() => set('target_skill', skill)}
                                        className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${form.target_skill === skill
                                            ? 'bg-primary/10 border-primary text-primary font-medium'
                                            : 'bg-card border-border text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {MOBILITY_TARGET_SKILL_LABELS[skill]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Détente/récupération : pas de mouvement précis, l'utilisateur choisit directement la zone */
                        <div>
                            {form.source_sport === 'crossfit' && !form.focus_area && (
                                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground mb-3">
                                    <p className="font-medium text-foreground mb-1">Zones déduites automatiquement de ton WOD</p>
                                    <p>
                                        {form.source_workout_type && `Format : ${form.source_workout_type}. `}
                                        {form.source_focus_areas_text?.length
                                            ? `Zones mentionnées : ${form.source_focus_areas_text.join(', ')}.`
                                            : "Aucune zone précisée — l'IA choisira en fonction du format de la séance."}
                                    </p>
                                </div>
                            )}
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
                    )}

                    {/* Durée */}
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

                        {/* Zones travaillées (déduites du mouvement si goal=crossfit_technique) */}
                        <div className="flex flex-wrap gap-1.5">
                            {plan.target_skill && (
                                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                                    {MOBILITY_TARGET_SKILL_LABELS[plan.target_skill]}
                                </span>
                            )}
                            {plan.focus_areas.map(area => (
                                <span key={area} className="px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground text-xs">
                                    {MOBILITY_FOCUS_AREA_LABELS[area]}
                                </span>
                            ))}
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
