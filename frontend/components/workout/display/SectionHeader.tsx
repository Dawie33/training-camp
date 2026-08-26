import { Check } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  description?: string
  duration_min?: number
  isSectionCompleted?: boolean
}

export function SectionHeader({ title, description, duration_min, isSectionCompleted }: SectionHeaderProps) {
  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 flex-wrap">
        <span>{title}</span>
        {duration_min && <span className="text-[10px] font-normal text-muted-foreground">— {duration_min} min</span>}
        {isSectionCompleted && (
          <span className="px-2 py-0.5 bg-green-600/10 text-green-700 rounded-full text-[10px] font-semibold flex items-center gap-1">
            <Check className="w-2.5 h-2.5" />
            Terminé
          </span>
        )}
      </h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  )
}
