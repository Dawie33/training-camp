interface IntervalsWork {
  distance?: string
  duration?: string
  pace?: string
  effort?: string
}

interface IntervalsRest {
  duration?: string
  type?: 'active' | 'passive'
}

interface Intervals {
  work: IntervalsWork
  rest: IntervalsRest
}

interface SectionIntervalsProps {
  intervals?: Intervals
  rounds?: number
}

export function SectionIntervals({ intervals, rounds }: SectionIntervalsProps) {
  if (!intervals) return null

  return (
    <div className="bg-secondary/40 rounded-md p-2 space-y-1 border border-border">
      <div className="text-xs text-foreground">
        <span className="font-medium">Travail:</span>
        {intervals.work.distance && ` ${intervals.work.distance}`}
        {intervals.work.duration && ` ${intervals.work.duration}`}
        {intervals.work.pace && ` @ ${intervals.work.pace}`}
        {intervals.work.effort && ` (${intervals.work.effort})`}
      </div>
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">Repos:</span> {intervals.rest.duration}
        {intervals.rest.type && ` (${intervals.rest.type})`}
      </div>
      {rounds && <div className="text-xs font-medium text-primary">x {rounds} répétitions</div>}
    </div>
  )
}
