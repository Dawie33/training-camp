interface ScoreTypeTabsProps {
  scoreType: 'for_time' | 'amrap' | 'libre'
  onScoreTypeChange: (type: 'for_time' | 'amrap' | 'libre') => void
}

export function ScoreTypeTabs({ scoreType, onScoreTypeChange }: ScoreTypeTabsProps) {
  const tabs: { key: 'for_time' | 'amrap' | 'libre'; label: string }[] = [
    { key: 'for_time', label: 'For Time' },
    { key: 'amrap', label: 'AMRAP' },
    { key: 'libre', label: 'Libre' },
  ]

  return (
    <div className="flex gap-1 p-1 bg-muted/60 rounded-md">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onScoreTypeChange(tab.key)}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            scoreType === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
