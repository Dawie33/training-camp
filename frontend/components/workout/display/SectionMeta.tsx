interface SectionMetaProps {
  format?: string
  goal?: string
  focus?: string
}

export function SectionMeta({ format, goal, focus }: SectionMetaProps) {
  return (
    <>
      {format && (
        <div className="text-xs px-2 py-1.5 bg-secondary/40 rounded-md border border-border">
          <span className="text-muted-foreground font-medium">Format:</span> <span className="text-foreground">{format}</span>
        </div>
      )}

      {goal && (
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground font-medium">Objectif:</span> {goal}
        </div>
      )}

      {focus && (
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground font-medium">Focus:</span> {focus}
        </div>
      )}
    </>
  )
}
