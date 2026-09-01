'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  generateHref: string
  description?: string
}

export function EmptyState({ generateHref, description }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <h1 className="font-display text-3xl font-semibold mb-2">Aucun programme actif</h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        {description ?? 'Crée un programme structuré adapté à ton objectif — force, endurance, compétition ou objectif libre.'}
      </p>
      <Button asChild className="rounded-full px-6 py-5 font-display font-semibold">
        <Link href={generateHref}>
          <Plus className="w-4 h-4 mr-2" />
          Créer un programme
        </Link>
      </Button>
    </div>
  )
}
