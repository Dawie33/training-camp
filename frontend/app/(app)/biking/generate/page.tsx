'use client'

import { BIKE_TYPE_LABELS, BikeType, bikingService, GenerateBikingDto, GeneratedBikingPlan } from '@/services/biking'
import { Bike, Clock, Sparkles, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const BIKE_TYPES: BikeType[] = ['endurance', 'sweet_spot', 'intervals', 'ftp_test', 'recovery', 'race']

export default function BikingGeneratePage() {
    const router = useRouter()
    const [form, setForm] = useState<GenerateBikingDto>({
        bike_type: 'endurance',
        duration_minutes: 60,
    })
    const [preview, setPreview] = useState<GeneratedBikingPlan | null>(null)
    const [generating, setGenerating] = useState(false)
    const [saving, setSaving] = useState(false)

    const set = (key: keyof GenerateBikingDto, value: string | number | undefined) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const handleGenerate = async () => {
        setGenerating(true)
        setPreview(null)
        try {
            const plan = await bikingService.generatePreview(form)
            setPreview(plan)
        } catch {
            toast.error('Erreur lors de la génération. Réessaie.')
        } finally {
            setGenerating(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await bikingService.generateAndSave(form)
            toast.success('Séance sauvegardée !')
            router.push('/biking')
        } catch {
            toast.error('Erreur lors de la sauvegarde')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-2xl space-y-6">
            {/* Formulaire */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-5">
                <h2 className="eyebrow">Paramètres de la séance</h2>

                {/* Type */}
                <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Type de séance</label>
                    <div className="grid grid-cols-2 gap-2">
                        {BIKE_TYPES.map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => set('bike_type', type)}
                                className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${form.bike_type === type
                                    ? 'bg-primary/10 border-primary text-primary font-medium'
                                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {BIKE_TYPE_LABELS[type]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Durée + FTP */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Durée (min)</label>
                        <input
                            type="number"
                            value={form.duration_minutes}
                            min={10}
                            max={300}
                            onChange={e => set('duration_minutes', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">FTP (W, optionnel)</label>
                        <input
                            type="number"
                            min={50}
                            placeholder="ex: 250"
                            onChange={e => set('ftp_watts', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                </div>

                {/* Objectif */}
                <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Objectif / contexte (optionnel)</label>
                    <input
                        type="text"
                        placeholder="ex: préparer une cyclosportive, améliorer mon FTP, récupération active..."
                        onChange={e => set('goal', e.target.value || undefined)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold text-sm transition-colors"
                >
                    <Sparkles className="w-4 h-4" />
                    {generating ? 'Génération en cours...' : 'Générer la séance'}
                </button>
            </div>

            {/* Preview */}
            {preview && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="font-bold text-foreground text-lg">{preview.name}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">{preview.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                {preview.estimated_duration_minutes} min
                            </span>
                            {preview.tss_estimate && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Zap className="w-3.5 h-3.5" />
                                    TSS ~{preview.tss_estimate}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Structure */}
                    <div className="space-y-2">
                        {preview.structure.map((block, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <div className="w-1 self-stretch rounded-full bg-primary/40 flex-shrink-0 mt-1" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-foreground">{block.label}</span>
                                        <span className="text-xs text-muted-foreground">{block.duration_minutes} min</span>
                                        <span className="text-xs text-primary font-medium">{block.power_target}</span>
                                    </div>
                                    {block.intervals && block.intervals.length > 0 && (
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {block.intervals[0].repetitions}× {block.intervals[0].effort_duration} @ {block.intervals[0].power_description} / {block.intervals[0].recovery_duration} récup.
                                        </div>
                                    )}
                                    {block.notes && <p className="mt-0.5 text-xs text-muted-foreground italic">{block.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Conseils */}
                    <div className="rounded-lg bg-card border border-border p-3 space-y-1">
                        <p className="text-xs font-semibold text-foreground">Conseils coach</p>
                        <p className="text-xs text-muted-foreground">{preview.coaching_tips}</p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold text-sm transition-colors"
                    >
                        <Bike className="w-4 h-4" />
                        {saving ? 'Sauvegarde...' : 'Sauvegarder cette séance'}
                    </button>
                </div>
            )}
        </div>
    )
}
