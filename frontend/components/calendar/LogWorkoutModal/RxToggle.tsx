interface RxToggleProps {
  isRx: boolean
  onIsRxChange: (value: boolean) => void
}

export function RxToggle({ isRx, onIsRxChange }: RxToggleProps) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-2 block">Performance</label>
      <div className="flex gap-2">
        <button
          onClick={() => onIsRxChange(true)}
          className={`flex-1 py-2 text-sm font-semibold rounded-md border transition-colors ${
            isRx
              ? 'bg-emerald-600/10 border-emerald-600/30 text-emerald-700'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Rx
        </button>
        <button
          onClick={() => onIsRxChange(false)}
          className={`flex-1 py-2 text-sm font-semibold rounded-md border transition-colors ${
            !isRx
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Scaled
        </button>
      </div>
    </div>
  )
}
