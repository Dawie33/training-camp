import { EQUIPMENT_CATEGORIES, EQUIPMENT_PRESETS } from '@/domain/entities/equipment-options'
import Link from 'next/link'

interface EquipmentTabProps {
  equipment: string[]
  saving: boolean
  onToggle: (item: string) => void
  onPreset: (items: string[]) => void
  onClear: () => void
  onSave: () => void
}

export function EquipmentTab({ equipment, saving, onToggle, onPreset, onClear, onSave }: EquipmentTabProps) {
  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold">Équipement disponible</h2>
        <p className="text-sm text-slate-400 mt-1">
          Renseignez l'équipement dont vous disposez pour que l'IA génère des workouts adaptés.
        </p>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {EQUIPMENT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onPreset(preset.items)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
          >
            {preset.label}
          </button>
        ))}
        {equipment.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Tout effacer
          </button>
        )}
      </div>

      {/* Equipment grid */}
      <div className="space-y-3 rounded-xl p-3 bg-slate-900/50 border border-slate-700/50">
        {EQUIPMENT_CATEGORIES.map((group) => (
          <div key={group.category}>
            <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{group.category}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item) => {
                const isSelected = equipment.includes(item.value)
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onToggle(item.value)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30'
                        : 'border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {equipment.length > 0 && (
        <p className="text-xs text-orange-400 font-medium">
          {equipment.length} équipement{equipment.length > 1 ? 's' : ''} sélectionné{equipment.length > 1 ? 's' : ''}
        </p>
      )}

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {saving ? 'Sauvegarde...' : "Sauvegarder l'équipement"}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Tu cherches tes 1RM ? Ils se gèrent maintenant dans{' '}
        <Link href="/force/rm" className="text-orange-400 hover:underline">
          Force → Mes RM
        </Link>
      </p>
    </div>
  )
}
