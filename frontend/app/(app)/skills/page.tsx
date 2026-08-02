'use client'

import { Button } from '@/components/ui/button'
import { SkillsGrid } from '@/components/skills/SkillsGrid'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function SkillsPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10">
      {/* Header éditorial */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <div className="eyebrow mb-3">Compétences · progression sur le long terme</div>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-none tracking-tight">
            Progressions
          </h1>
        </div>
        <Button asChild className="rounded-full px-6 py-5 font-display font-semibold">
          <Link href="/skills/new">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau programme
          </Link>
        </Button>
      </motion.header>

      <div className="rule-strong" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SkillsGrid />
      </motion.div>
    </div>
  )
}
