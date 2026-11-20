import { Button } from '@/components/ui/button'
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
    <div className="bg-card rounded-lg border border-border p-4 sm:p-6 space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">Équipement disponible</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Renseignez l'équipement dont vous disposez pour que l'IA génère des workouts adaptés.
        </p>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {EQUIPMENT_PRESETS.map((preset) => (
          <Button variant="ghost"
            key={preset.label}
            type="button"
            onClick={() => onPreset(preset.items)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-background border border-border text-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {preset.label}
          </Button>
        ))}
        {equipment.length > 0 && (
          <Button variant="ghost"
            type="button"
            onClick={onClear}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors"
          >
            Tout effacer
          </Button>
        )}
      </div>

      {/* Equipment grid */}
      <div className="space-y-3 rounded-xl p-3 bg-background border border-border">
        {EQUIPMENT_CATEGORIES.map((group) => (
          <div key={group.category}>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">{group.category}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item) => {
                const isSelected = equipment.includes(item.value)
                return (
                  <Button variant="ghost"
                    key={item.value}
                    aria-pressed={isSelected}
                    type="button"
                    onClick={() => onToggle(item.value)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground'
                        : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {equipment.length > 0 && (
        <p className="text-xs text-primary font-medium">
          {equipment.length} équipement{equipment.length > 1 ? 's' : ''} sélectionné{equipment.length > 1 ? 's' : ''}
        </p>
      )}

      <Button variant="default"
        onClick={onSave}
        disabled={saving}
        className="w-full h-auto whitespace-normal px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {saving ? 'Sauvegarde...' : "Sauvegarder l'équipement"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Tu cherches tes 1RM ? Ils se gèrent maintenant dans{' '}
        <Link href="/crossfit/rm" className="text-primary hover:underline">
          Force → Mes RM
        </Link>
      </p>
    </div>
  )
}
