interface AMRAPScoreInputProps {
  rounds: string
  bonusReps: string
  onRoundsChange: (value: string) => void
  onBonusRepsChange: (value: string) => void
}

export function AMRAPScoreInput({ rounds, bonusReps, onRoundsChange, onBonusRepsChange }: AMRAPScoreInputProps) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-2 block">Score</label>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2">
          <input
            type="number"
            min="0"
            value={rounds}
            onChange={e => onRoundsChange(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-foreground text-center text-lg font-mono outline-none"
          />
          <span className="text-muted-foreground text-sm">rounds</span>
        </div>
        <span className="text-muted-foreground">+</span>
        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2">
          <input
            type="number"
            min="0"
            value={bonusReps}
            onChange={e => onBonusRepsChange(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-foreground text-center text-lg font-mono outline-none"
          />
          <span className="text-muted-foreground text-sm">reps</span>
        </div>
      </div>
    </div>
  )
}
