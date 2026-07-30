'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useDailyWorkout } from '../_hooks/useDailyWorkout'
import { SectionHeader } from './SectionHeader'

export function DailyWorkoutCard({ index }: { index?: string } = {}) {
  const { dailyWorkout, workoutLoading } = useDailyWorkout()

  if (workoutLoading) {
    return (
      <div>
        <SectionHeader index={index} title="Workout du jour" />
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!dailyWorkout) {
    return (
      <div>
        <SectionHeader index={index} title="Workout du jour" />
        <p className="text-sm text-muted-foreground">
          Aucun workout disponible pour aujourd&apos;hui
        </p>
      </div>
    )
  }

  const metrics: { label: string; value: React.ReactNode; accent?: boolean }[] = [
    {
      label: 'Durée',
      value: (
        <>
          {dailyWorkout.estimated_duration || 'N/A'}
          <span className="text-lg text-muted-foreground"> min</span>
        </>
      ),
    },
    { label: 'Intensité', value: dailyWorkout.intensity || 'Modérée', accent: true },
  ]
  if (dailyWorkout.blocks?.sections) {
    metrics.push({ label: 'Blocs', value: dailyWorkout.blocks.sections.length })
  }

  return (
    <div>
      <SectionHeader index={index} title="Workout du jour" right="Aujourd'hui" />

      {/* Titre + CTA répartis sur la ligne */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-4xl sm:text-5xl font-semibold leading-none">
            {dailyWorkout.name}
          </h2>
          {dailyWorkout.description && (
            <p className="text-muted-foreground max-w-xl mt-4">
              {dailyWorkout.description}
            </p>
          )}
        </div>
        <Button asChild className="group shrink-0 self-start rounded-full px-7 py-6 font-display text-base font-semibold sm:self-end">
          <Link href={`/workout/${dailyWorkout.id}`}>
            Commencer le workout
            <span className="ml-1 group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Link>
        </Button>
      </div>

      {/* Métadonnées réparties sur toute la largeur, séparées par des filets */}
      <div className="mt-8 flex border-y border-border">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`flex-1 py-4 ${i > 0 ? 'border-l border-border pl-5' : ''} ${i < metrics.length - 1 ? 'pr-5' : ''}`}
          >
            <div className="eyebrow mb-1">{m.label}</div>
            <div className={`font-display text-3xl font-semibold capitalize ${m.accent ? 'text-primary' : ''}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Aperçu des blocs — liste en ligne, séparée par des points */}
      {dailyWorkout.blocks?.sections && dailyWorkout.blocks.sections.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {dailyWorkout.blocks.sections.map((section, i) => (
            <span key={i} className="flex items-center gap-3">
              {i > 0 && <span className="text-border">·</span>}
              {section.title || `Bloc ${i + 1}`}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
