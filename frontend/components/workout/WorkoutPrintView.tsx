'use client'

import { Workouts } from '@/domain/entities/workout'
import { WorkoutSection } from '@/domain/entities/workout-structure'

interface WorkoutPrintViewProps {
  workout: Workouts
}

function formatExerciseLine(ex: {
  name: string
  sets?: number
  reps?: number | string
  weight?: string
  duration?: string
  distance?: string
  details?: string
}): string {
  const parts: string[] = []
  if (ex.sets && ex.sets > 1) parts.push(`${ex.sets}×`)
  if (ex.reps) parts.push(`${ex.reps}`)
  parts.push(ex.name)
  if (ex.weight) parts.push(`@ ${ex.weight}`)
  if (ex.duration) parts.push(`(${ex.duration})`)
  if (ex.distance) parts.push(ex.distance)
  if (ex.details) parts.push(`— ${ex.details}`)
  return parts.join(' ')
}

function sectionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    warmup: 'Échauffement',
    skill_work: 'Technique',
    strength: 'Force',
    accessory: 'Accessoire',
    cardio: 'Cardio',
    metcon: 'MetCon',
    amrap: 'AMRAP',
    emom: 'EMOM',
    for_time: 'For Time',
    circuit: 'Circuit',
    finisher: 'Finisher',
    core: 'Core',
    mobility: 'Mobilité',
    cooldown: 'Retour au calme',
    tabata: 'Tabata',
    intervals: 'Intervalles',
  }
  return labels[type] || type
}

function PrintSection({ section }: { section: WorkoutSection }) {
  const typeLabel = sectionTypeLabel(section.type)
  const formatLine = [
    section.format,
    section.duration_min ? `${section.duration_min} min` : null,
    section.rounds ? `${section.rounds} rounds` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="print-section">
      <div className="print-section-header">
        <span className="print-section-type">{typeLabel}</span>
        <span className="print-section-title">{section.title}</span>
        {formatLine && <span className="print-section-format">{formatLine}</span>}
      </div>
      {section.description && (
        <p className="print-section-desc">{section.description}</p>
      )}
      {section.exercises && section.exercises.length > 0 && (
        <ul className="print-exercise-list">
          {section.exercises.map((ex, i) => (
            <li key={i} className="print-exercise-item">
              <span className="print-bullet">—</span>
              <span>{formatExerciseLine(ex)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function WorkoutPrintView({ workout }: WorkoutPrintViewProps) {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #workout-print-view, #workout-print-view * { visibility: visible; }
          #workout-print-view {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            padding: 32px 40px;
          }
        }

        #workout-print-view {
          display: none;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          color: #0f172a;
          max-width: 680px;
          margin: 0 auto;
          padding: 32px 40px;
          font-size: 13px;
          line-height: 1.5;
        }

        @media print {
          #workout-print-view { display: block; }
        }

        .print-header {
          border-bottom: 3px solid #f97316;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }

        .print-app-name {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #f97316;
          margin-bottom: 4px;
        }

        .print-workout-name {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px 0;
        }

        .print-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .print-tag {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 10px;
          border-radius: 999px;
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #fed7aa;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .print-tag-neutral {
          background: #f8fafc;
          color: #475569;
          border-color: #e2e8f0;
        }

        .print-stimulus {
          margin: 16px 0 0 0;
          font-style: italic;
          color: #475569;
          font-size: 13px;
        }

        .print-section {
          margin-bottom: 20px;
          break-inside: avoid;
        }

        .print-section-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 6px;
          padding-bottom: 4px;
          border-bottom: 1px solid #e2e8f0;
        }

        .print-section-type {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #f97316;
          min-width: fit-content;
        }

        .print-section-title {
          font-weight: 700;
          font-size: 14px;
          color: #0f172a;
        }

        .print-section-format {
          font-size: 11px;
          color: #64748b;
          margin-left: auto;
        }

        .print-section-desc {
          color: #475569;
          font-size: 12px;
          margin: 4px 0 8px 0;
          font-style: italic;
        }

        .print-exercise-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .print-exercise-item {
          display: flex;
          gap: 8px;
          padding: 3px 0;
          font-size: 13px;
          color: #1e293b;
        }

        .print-bullet {
          color: #f97316;
          font-weight: 700;
          flex-shrink: 0;
        }

        .print-equipment {
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #64748b;
        }

        .print-footer {
          margin-top: 32px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
        }

        .print-score-box {
          margin-top: 24px;
          border: 1.5px dashed #cbd5e1;
          border-radius: 8px;
          padding: 12px 16px;
        }

        .print-score-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #94a3b8;
          margin-bottom: 24px;
        }

        .print-score-line {
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 8px;
          height: 24px;
        }
      `}</style>

      <div id="workout-print-view">
        {/* Header */}
        <div className="print-header">
          <div className="print-app-name">Training Camp · WOD</div>
          <h1 className="print-workout-name">{workout.name}</h1>
          <div className="print-meta">
            {workout.workout_type && (
              <span className="print-tag">{workout.workout_type.replace(/_/g, ' ')}</span>
            )}
            {workout.difficulty && (
              <span className="print-tag print-tag-neutral">{workout.difficulty}</span>
            )}
            {workout.estimated_duration && (
              <span className="print-tag print-tag-neutral">{workout.estimated_duration} min</span>
            )}
            {workout.intensity && (
              <span className="print-tag print-tag-neutral">{workout.intensity.replace(/_/g, ' ')}</span>
            )}
          </div>
          {workout.blocks?.stimulus && (
            <p className="print-stimulus">"{workout.blocks.stimulus}"</p>
          )}
        </div>

        {/* Sections */}
        {workout.blocks?.sections?.map((section, i) => (
          <PrintSection key={i} section={section} />
        ))}

        {/* Equipment */}
        {workout.equipment_required && workout.equipment_required.length > 0 && (
          <div className="print-equipment">
            <strong>Équipement :</strong> {workout.equipment_required.join(', ')}
          </div>
        )}

        {/* Score box */}
        <div className="print-score-box">
          <div className="print-score-title">Mon score</div>
          <div className="print-score-line" />
          <div className="print-score-line" />
        </div>

        {/* Footer */}
        <div className="print-footer">
          <span>Training Camp</span>
          <span>{today}</span>
        </div>
      </div>
    </>
  )
}

export function printWorkout() {
  window.print()
}
