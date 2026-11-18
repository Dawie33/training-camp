import type { SessionResults } from '../schemas/session-results.schema'

export function describeScore(results: SessionResults): string {
  if (results.cap_reached) {
    return [
      '- Cap atteint (DNF)',
      results.rounds_completed !== undefined ? `- Rounds terminés : ${results.rounds_completed}` : '',
      results.partial_note ? `- Progression au cap : ${results.partial_note}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }
  if (results.split_time_seconds !== undefined) {
    return `- Split : ${results.split_time_seconds}s ; puis ${results.reps_after_split ?? 0} reps`
  }
  if (results.rounds !== undefined || results.reps !== undefined) {
    return `- Score AMRAP : ${results.rounds ?? 0} rounds + ${results.reps ?? 0} reps`
  }
  if (results.elapsed_time_seconds !== undefined) {
    return `- Temps : ${Math.floor(results.elapsed_time_seconds / 60)}m${results.elapsed_time_seconds % 60}s`
  }
  return '- Workout complété (score libre)'
}

export function describeRx(results: SessionResults): string {
  if (!results.exercise_results?.length) return 'Non renseigné'
  return results.exercise_results.some(exercise => exercise.scaled) ? 'Non (Scaled)' : 'Oui'
}

export function describeEffort(results: SessionResults): string {
  return [
    `- RX : ${describeRx(results)}`,
    results.rpe !== undefined ? `- RPE séance : ${results.rpe}/10` : '',
    results.rating !== undefined ? `- Ressenti : ${results.rating}/5` : '',
    results.session_duration_minutes !== undefined ? `- Durée totale : ${results.session_duration_minutes} min` : '',
    ...(results.exercise_results ?? []).map(exercise =>
      [
        `- ${exercise.name} (${exercise.section_type})`,
        exercise.load_kg !== undefined ? `${exercise.load_kg} kg` : '',
        exercise.reps_completed !== undefined ? `${exercise.reps_completed} reps` : '',
        exercise.sets_completed !== undefined ? `${exercise.sets_completed} séries` : '',
        exercise.scaled ? `Scaled : ${exercise.scaling_note ?? 'oui'}` : 'RX',
        exercise.note ?? '',
      ]
        .filter(Boolean)
        .join(' ; ')
    ),
  ]
    .filter(Boolean)
    .join('\n')
}
