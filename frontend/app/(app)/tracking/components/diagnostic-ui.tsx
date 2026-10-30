/** Briques communes aux panneaux du diagnostic de performance. */

export function Section({ title, subtitle, icon, children }: {
  title: string
  subtitle?: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="bg-card border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground bg-secondary/40 border border-dashed border-border rounded-lg px-4 py-3">
      {children}
    </p>
  )
}
