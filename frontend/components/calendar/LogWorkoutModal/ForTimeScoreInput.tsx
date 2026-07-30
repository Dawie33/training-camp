import { TimeInput } from '@/components/ui/time-input'

interface ForTimeScoreInputProps {
  mins: string
  secs: string
  capAtteint: boolean
  capScore: string
  capDescription: string
  onMinsChange: (value: string) => void
  onSecsChange: (value: string) => void
  onCapAtteintChange: (value: boolean) => void
  onCapScoreChange: (value: string) => void
  onCapDescriptionChange: (value: string) => void
}

export function ForTimeScoreInput({
  mins,
  secs,
  capAtteint,
  capScore,
  capDescription,
  onMinsChange,
  onSecsChange,
  onCapAtteintChange,
  onCapScoreChange,
  onCapDescriptionChange,
}: ForTimeScoreInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Temps</label>
        <button
          onClick={() => onCapAtteintChange(!capAtteint)}
          className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
            capAtteint
              ? 'bg-red-600/10 border-red-600/30 text-red-700'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Cap atteint
        </button>
      </div>
      {!capAtteint ? (
        <TimeInput minutes={mins} seconds={secs} onMinutesChange={onMinsChange} onSecondsChange={onSecsChange} />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-red-600/10 border border-red-600/30 rounded-md px-3 py-2">
            <input
              type="number"
              min="0"
              value={capScore}
              onChange={e => onCapScoreChange(e.target.value)}
              placeholder="0"
              className="w-24 bg-transparent text-foreground text-center text-lg font-mono outline-none"
            />
            <span className="text-red-700 text-sm">reps total (score officiel)</span>
          </div>
          <input
            type="text"
            value={capDescription}
            onChange={e => onCapDescriptionChange(e.target.value)}
            placeholder="Ex: Round 2 + 24m lunges + 15 chest-to-bar"
            className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-red-600/50"
          />
        </div>
      )}
    </div>
  )
}
