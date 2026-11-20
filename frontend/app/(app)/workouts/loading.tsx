/**
 * Squelette de chargement affiché par Next.js pendant le chargement de `/workouts`.
 */
export default function WorkoutsLoading() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-muted rounded-lg" />
        <div className="h-10 w-32 bg-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-card rounded-lg border border-border" />
        ))}
      </div>
    </div>
  )
}
