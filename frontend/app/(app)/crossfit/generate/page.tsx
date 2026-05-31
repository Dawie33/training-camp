'use client'

import { ParseBoxWodModal } from '@/components/calendar/ParseBoxWodModal'
import Link from 'next/link'
import { useState } from 'react'

type ParseMode = 'instagram' | 'search'

export default function CrossFitGeneratePage() {
  const [parseModalOpen, setParseModalOpen] = useState(false)
  const [parseModalMode, setParseModalMode] = useState<ParseMode>('instagram')

  const openParseModal = (mode: ParseMode) => {
    setParseModalMode(mode)
    setParseModalOpen(true)
  }

  return (
    <>
      <div className="space-y-3 max-w-lg">

        <button
          onClick={() => openParseModal('instagram')}
          className="w-full px-4 py-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-700/40 transition-colors text-left"
        >
          <p className="text-sm font-medium text-white">Coller depuis Instagram</p>
          <p className="text-xs text-slate-400 mt-0.5">Colle le post de ta box — l'IA extrait le WOD</p>
        </button>

        <button
          onClick={() => openParseModal('search')}
          className="w-full px-4 py-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-700/40 transition-colors text-left"
        >
          <p className="text-sm font-medium text-white">Rechercher un WOD</p>
          <p className="text-xs text-slate-400 mt-0.5">Benchmark, Open, Hero WOD...</p>
        </button>

        <Link
          href="/workouts/generate-ai"
          className="block w-full px-4 py-3.5 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/15 transition-colors text-left"
        >
          <p className="text-sm font-medium text-orange-300">Générer avec l'IA</p>
          <p className="text-xs text-orange-400/60 mt-0.5">Créer un WOD personnalisé selon ton niveau et matériel</p>
        </Link>

      </div>

      <ParseBoxWodModal
        open={parseModalOpen}
        onOpenChange={setParseModalOpen}
        initialMode={parseModalMode}
      />
    </>
  )
}
