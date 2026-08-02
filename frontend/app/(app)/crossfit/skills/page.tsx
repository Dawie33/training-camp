'use client'

import { SkillsGrid } from '@/components/skills/SkillsGrid'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function CrossfitSkillsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Progressions</span>
        <Link href="/skills/new" className="text-xs text-primary hover:underline underline-offset-2 flex items-center gap-1">
          <Plus className="w-3 h-3" />
          Nouveau programme
        </Link>
      </div>
      <div className="rule" />

      <SkillsGrid />
    </div>
  )
}
