'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

interface BentoCardProps {
  /** Libellé en petites capitales, en tête de carte. */
  eyebrow?: string
  title?: string
  /** Lien d'approfondissement, matérialisé par une flèche en coin. */
  href?: string
  hrefLabel?: string
  /** Classes de placement dans la grille (col-span / row-span). */
  className?: string
  /** Surface accentuée, pour la carte qui porte l'information principale. */
  accent?: boolean
  children: React.ReactNode
}

/**
 * Carte du dashboard. Toutes les cartes partagent le même rayon et la même
 * surface pour que la grille se lise comme un seul bloc, quel que soit leur format.
 */
export function BentoCard({
  eyebrow,
  title,
  href,
  hrefLabel,
  className = '',
  accent = false,
  children,
}: BentoCardProps) {
  const surface = accent
    ? 'bg-primary/8 border-primary/25'
    : 'bg-card border-border'

  const content = (
    <div
      className={`group relative h-full rounded-2xl border ${surface} p-5 transition-colors ${
        href ? 'hover:border-foreground/25' : ''
      } ${className}`}
    >
      {(eyebrow || title || href) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {eyebrow}
              </p>
            )}
            {title && <h3 className="font-semibold text-foreground mt-0.5 truncate">{title}</h3>}
          </div>
          {href && (
            <span
              aria-hidden
              className="shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground transition-colors group-hover:border-foreground/30 group-hover:text-foreground"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  )

  if (!href) return content

  return (
    <Link href={href} aria-label={hrefLabel ?? title} className="block h-full">
      {content}
    </Link>
  )
}

/** Valeur chiffrée mise en avant, avec son unité et son libellé. */
export function BentoStat({ value, unit, label }: { value: string | number; unit?: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl font-semibold leading-none tracking-tight text-foreground">
        {value}
        {unit && <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
      <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
    </div>
  )
}

/** Message affiché quand une carte n'a pas encore de données à montrer. */
export function BentoEmpty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
}
