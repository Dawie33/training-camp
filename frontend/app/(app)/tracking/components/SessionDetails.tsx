import { FitDataSummary } from '@/components/fit-import/FitDataSummary'
import type { WorkoutSessionResults } from '@/domain/entities/workout'

const sectionTitle = 'text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider'

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0')
  return `${minutes}:${seconds}`
}

/** Score du metcon tel que la page de log l'enregistre : temps, cap atteint, AMRAP ou split. */
function describeScore(results: WorkoutSessionResults): string | null {
  if (results.cap_reached) {
    const parts = ['Cap atteint']
    if (results.rounds_completed) parts.push(`${results.rounds_completed} rounds`)
    if (results.partial_note) parts.push(results.partial_note)
    return parts.join(' · ')
  }
  if (results.split_time_seconds && results.reps_after_split !== undefined) {
    return `${formatClock(results.split_time_seconds)} + ${results.reps_after_split} reps`
  }
  if (results.rounds !== undefined || results.reps !== undefined) {
    return `${results.rounds ?? 0} rounds + ${results.reps ?? 0} reps`
  }
  if (results.elapsed_time_seconds) return formatClock(results.elapsed_time_seconds)
  return null
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary border border-border rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  )
}

/**
 * Détail d'une séance enregistrée par la page de log : score, effort (RPE, durée, charge de séance),
 * résultats par exercice et données .fit. Chaque bloc ne s'affiche que s'il a été rempli.
 */
export function SessionDetails({ results }: { results: WorkoutSessionResults }) {
  const score = describeScore(results)
  const { rpe, session_duration_minutes: minutes } = results
  // Même calcul que le diagnostic (charge sRPE) : RPE × durée de la séance entière
  const load = rpe && minutes ? Math.round(rpe * minutes) : null
  const exercises = results.exercise_results ?? []

  return (
    <>
      {(score || rpe || minutes) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {score && <Stat label="Score" value={score} />}
          {rpe ? <Stat label="RPE" value={`${rpe}/10`} /> : null}
          {minutes ? <Stat label="Durée de la séance" value={`${minutes} min`} /> : null}
          {load ? <Stat label="Charge (RPE × min)" value={String(load)} /> : null}
        </div>
      )}

      {exercises.length > 0 && (
        <div>
          <h4 className={sectionTitle}>Exercices</h4>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-3 py-2 font-medium">Exercice</th>
                  <th className="px-3 py-2 font-medium text-right">Charge</th>
                  <th className="px-3 py-2 font-medium text-right">Reps</th>
                  <th className="px-3 py-2 font-medium text-right">Séries</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((exercise, idx) => (
                  <tr key={`${exercise.name}-${idx}`} className="border-b border-border last:border-0 align-top">
                    <td className="px-3 py-2 text-foreground">
                      {exercise.name}
                      {exercise.scaled && (
                        <span className="block text-xs text-muted-foreground">
                          Adapté{exercise.scaling_note ? ` : ${exercise.scaling_note}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                      {exercise.load_kg ? `${exercise.load_kg} kg` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{exercise.reps_completed ?? '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{exercise.sets_completed ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.coros?.activities?.length ? (
        <div>
          <h4 className={sectionTitle}>Montre (.fit)</h4>
          <FitDataSummary data={results.coros} />
        </div>
      ) : null}
    </>
  )
}
