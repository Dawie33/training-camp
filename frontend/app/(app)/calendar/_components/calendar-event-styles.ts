export const statusColors: Record<string, { dot: string; text: string; bg: string }> = {
  scheduled: { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-500/15' },
  completed: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-500/15' },
  skipped: { dot: 'bg-stone-400', text: 'text-stone-500', bg: 'bg-stone-400/15' },
  rescheduled: { dot: 'bg-primary', text: 'text-primary', bg: 'bg-primary/15' },
}

// Badge coloré par module (affiché uniquement pour les modules non-CrossFit)
export const moduleBadges: Record<string, { label: string; color: string }> = {
  skill: { label: 'SKILL', color: 'bg-primary text-primary-foreground' },
}
