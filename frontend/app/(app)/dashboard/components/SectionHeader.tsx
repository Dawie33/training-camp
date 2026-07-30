import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  /** Numéro de section, ex. "01" */
  index?: string
  title: string
  /** Contenu aligné à droite (méta, statut…) */
  right?: React.ReactNode
  className?: string
}

/**
 * En-tête de section éditorial : numéro terracotta + libellé en petites capitales
 * + filet fort. Assure une séparation nette entre les blocs du dashboard.
 */
export function SectionHeader({ index, title, right, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-7', className)}>
      <div className="flex items-baseline justify-between mb-3">
        <span className="eyebrow">
          {index && <span className="text-primary mr-2">{index}</span>}
          {title}
        </span>
        {right && <span className="eyebrow">{right}</span>}
      </div>
      <div className="rule-strong" />
    </div>
  )
}
