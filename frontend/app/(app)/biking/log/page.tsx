'use client'

import { CorosImport } from '@/components/fit-import/CorosImport'
import { MultiActivityFitData } from '@/services/fit-import'
import { BIKE_LOCATION_LABELS, BIKE_TYPE_LABELS, BikeLocationType, BikeType, bikingService, CreateBikingSessionDto } from '@/services/biking'
import { Home, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const BIKE_TYPES: BikeType[] = ['endurance', 'sweet_spot', 'intervals', 'ftp_test', 'recovery', 'race']
const BIKE_LOCATIONS: BikeLocationType[] = ['outdoor', 'indoor']

export default function BikingLogPage() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [fitData, setFitData] = useState<MultiActivityFitData | null>(null)

    const [form, setForm] = useState<CreateBikingSessionDto>({
        session_date: new Date().toISOString().slice(0, 10),
        bike_type: 'endurance',
        location_type: 'outdoor',
    })

    const isIndoor = form.location_type === 'indoor'

    const set = (key: keyof CreateBikingSessionDto, value: string | number | undefined) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const setLocationType = (location: BikeLocationType) =>
        setForm(prev => ({ ...prev, location_type: location, distance_km: location === 'indoor' ? undefined : prev.distance_km }))

    const handleCorosImport = (data: MultiActivityFitData) => {
        setFitData(data)
        const updates: Partial<CreateBikingSessionDto> = {}
        if (data.totals.duration_seconds) {
            updates.duration_seconds = data.totals.duration_seconds
        }
        if (!isIndoor && data.totals.distance_meters && data.totals.distance_meters > 0) {
            updates.distance_km = Math.round((data.totals.distance_meters / 1000) * 100) / 100
        }
        if (data.totals.avg_power) {
            updates.avg_power_watts = data.totals.avg_power
        }
        const bikeActivity = data.activities.find(a => {
            const sport = a.sport?.toLowerCase() ?? ''
            return sport.includes('cycl') || sport.includes('bik')
        })
        if (bikeActivity?.avg_heart_rate) {
            updates.avg_heart_rate = bikeActivity.avg_heart_rate
        }
        if (bikeActivity?.max_heart_rate) {
            updates.max_heart_rate = bikeActivity.max_heart_rate
        }
        if (data.totals.calories) {
            updates.calories = data.totals.calories
        }
        setForm(prev => ({ ...prev, ...updates }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await bikingService.create(form)
            toast.success('Séance enregistrée !')
            router.push('/biking')
        } catch {
            toast.error('Erreur lors de l\'enregistrement')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
            {/* Date */}
            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                <input
                    type="date"
                    value={form.session_date}
                    onChange={e => set('session_date', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
            </div>

            {/* Type */}
            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Type de séance</label>
                <div className="grid grid-cols-2 gap-2">
                    {BIKE_TYPES.map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => set('bike_type', type)}
                            className={`px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${form.bike_type === type
                                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 font-medium'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            {BIKE_TYPE_LABELS[type]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Intérieur / Extérieur */}
            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Lieu</label>
                <div className="grid grid-cols-2 gap-2">
                    {BIKE_LOCATIONS.map(location => (
                        <button
                            key={location}
                            type="button"
                            onClick={() => setLocationType(location)}
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${form.location_type === location
                                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 font-medium'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            {location === 'indoor' ? <Home className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                            {BIKE_LOCATION_LABELS[location]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Durée + Distance */}
            <div className={`grid gap-3 ${isIndoor ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Durée (min)</label>
                    <input
                        type="number"
                        min={1}
                        placeholder="60"
                        value={form.duration_seconds ? Math.round(form.duration_seconds / 60) : ''}
                        onChange={e => set('duration_seconds', e.target.value ? Number(e.target.value) * 60 : undefined)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    />
                </div>
                {!isIndoor && (
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Distance (km)</label>
                        <input
                            type="number"
                            step="0.1"
                            min={0}
                            placeholder="25.5"
                            value={form.distance_km ?? ''}
                            onChange={e => set('distance_km', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                        />
                    </div>
                )}
            </div>

            {/* Puissance + FTP */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Puissance moy. (W)</label>
                    <input
                        type="number"
                        min={0}
                        placeholder="200"
                        value={form.avg_power_watts ?? ''}
                        onChange={e => set('avg_power_watts', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">FTP (W)</label>
                    <input
                        type="number"
                        min={50}
                        placeholder="250"
                        value={form.ftp_watts ?? ''}
                        onChange={e => set('ftp_watts', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    />
                </div>
            </div>

            {/* FC */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">FC moy. (bpm)</label>
                    <input
                        type="number"
                        min={30}
                        placeholder="140"
                        value={form.avg_heart_rate ?? ''}
                        onChange={e => set('avg_heart_rate', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Calories</label>
                    <input
                        type="number"
                        min={0}
                        placeholder="500"
                        value={form.calories ?? ''}
                        onChange={e => set('calories', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    />
                </div>
            </div>

            {/* Effort perçu */}
            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Effort perçu {form.perceived_effort ? `— ${form.perceived_effort}/10` : ''}
                </label>
                <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={form.perceived_effort ?? 5}
                    onChange={e => set('perceived_effort', Number(e.target.value))}
                    className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                    <span>Très facile</span>
                    <span>Maximal</span>
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea
                    placeholder="Sensations, conditions, objectifs atteints..."
                    rows={3}
                    value={form.notes ?? ''}
                    onChange={e => set('notes', e.target.value || undefined)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
                />
            </div>

            <CorosImport accentColor="blue" onImport={handleCorosImport} onClear={() => setFitData(null)} />

            <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
            >
                {submitting ? 'Enregistrement...' : 'Enregistrer la séance'}
            </button>
        </form>
    )
}
