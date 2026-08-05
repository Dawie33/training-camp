'use client'

import { Loader2, Sparkles } from 'lucide-react'

interface ParseStrengthTextFormProps {
  text: string
  setText: (v: string) => void
  analyzing: boolean
  onAnalyze: () => void
}

export function ParseStrengthTextForm({ text, setText, analyzing, onAnalyze }: ParseStrengthTextFormProps) {
  return (
    <div className="max-w-2xl bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
      <label className="block text-sm font-medium text-foreground">
        Colle le texte d'une séance vue ailleurs
      </label>
      <textarea
        rows={10}
        placeholder="Colle ici une légende Instagram/TikTok, un programme trouvé en ligne..."
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-border bg-secondary/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground resize-none"
      />
      <button
        onClick={onAnalyze}
        disabled={analyzing || text.trim().length < 10}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-semibold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {analyzing
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours...</>
          : <><Sparkles className="w-4 h-4" /> Analyser</>
        }
      </button>
    </div>
  )
}
