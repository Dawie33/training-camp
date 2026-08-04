'use client'

import { fadeInUp } from '@/lib/animations'
import { motion } from 'framer-motion'
import { Loader2, Sparkles } from 'lucide-react'

interface ParseStrengthTextFormProps {
  text: string
  setText: (v: string) => void
  analyzing: boolean
  onAnalyze: () => void
}

export function ParseStrengthTextForm({ text, setText, analyzing, onAnalyze }: ParseStrengthTextFormProps) {
  return (
    <motion.div variants={fadeInUp} className="space-y-3">
      <label className="block text-sm font-semibold text-slate-300">
        Colle le texte d'une séance vue ailleurs
      </label>
      <textarea
        rows={10}
        placeholder="Colle ici une légende Instagram/TikTok, un programme trouvé en ligne..."
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-slate-600 resize-none"
      />
      <button
        onClick={onAnalyze}
        disabled={analyzing || text.trim().length < 10}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400 border border-violet-500/30 rounded-xl hover:from-violet-500/30 hover:to-purple-500/30 transition-all font-semibold disabled:opacity-50"
      >
        {analyzing
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours...</>
          : <><Sparkles className="w-4 h-4" /> Analyser</>
        }
      </button>
    </motion.div>
  )
}
