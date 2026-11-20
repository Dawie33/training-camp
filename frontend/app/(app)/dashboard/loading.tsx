export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-card rounded-lg border border-border" />
        ))}
      </div>
      <div className="h-64 bg-card rounded-lg border border-border" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-48 bg-card rounded-lg border border-border" />
        <div className="h-48 bg-card rounded-lg border border-border" />
      </div>
    </div>
  )
}
