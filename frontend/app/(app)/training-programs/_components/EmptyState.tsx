'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export function EmptyState() {
  return (
    <div className="text-center py-20">
      <h1 className="font-display text-3xl font-semibold mb-2">Aucun programme actif</h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Crée un programme structuré adapté à ton objectif — force, endurance, compétition ou objectif libre.
      </p>
      <Button asChild className="rounded-full px-6 py-5 font-display font-semibold">
        <Link href="/training-programs/generate">
          <Plus className="w-4 h-4 mr-2" />
          Créer un programme
        </Link>
      </Button>
    </div>
  )
}
