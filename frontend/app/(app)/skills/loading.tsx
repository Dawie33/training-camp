export default function SkillsLoading() {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-12 w-48 bg-muted rounded" />
        <div className="h-10 w-40 bg-muted rounded-full" />
      </div>
      <div className="h-px w-full bg-border" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-px w-full bg-border" />
            <div className="h-7 w-3/4 bg-muted rounded" />
            <div className="h-1.5 w-full bg-border rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
