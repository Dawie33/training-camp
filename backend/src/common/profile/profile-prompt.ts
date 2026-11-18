import type { UserAIContext } from 'src/user-context/types/user-context.types'

/** Donnees declaratives : ni diagnostic medical, ni calendrier planifie. */
export function buildProfilePreferenceLines(
  context: Pick<
    UserAIContext,
    'age' | 'gender' | 'resting_heart_rate' | 'max_heart_rate' | 'training_preferences' | 'schedule_preferences'
  >
): string[] {
  const lines: string[] = []
  if (context.age != null) lines.push(`Age : ${context.age} ans`)
  if (context.gender) lines.push(`Genre declare : ${context.gender} (ne pas en deduire les capacites)`)
  if (context.resting_heart_rate != null) lines.push(`FC de repos declaree : ${context.resting_heart_rate} bpm`)
  if (context.max_heart_rate != null) lines.push(`FC maximale declaree : ${context.max_heart_rate} bpm`)
  const { preferred_duration, sessions_per_week } = context.training_preferences
  if (preferred_duration != null) {
    lines.push(`Duree habituelle souhaitee : ${preferred_duration} min, echauffement et retour au calme inclus.`)
  }
  if (sessions_per_week != null) lines.push(`Frequence souhaitee : ${sessions_per_week} seances/semaine.`)
  const days = context.schedule_preferences?.available_days
  if (days?.length) lines.push(`Jours disponibles (indicatifs) : ${days.join(', ')}.`)
  if (lines.length) {
    lines.push(
      'Respecte la duree, la frequence et les disponibilites pour tes propositions ; une demande explicite de duree prime.' +
        ' Ne cree pas de calendrier. Une FC de repos isolee ne permet pas de conclure a un etat de recuperation.' +
        ' Ne deduis pas une FC maximale depuis le genre ou l age.'
    )
  }
  return lines
}

export function formatPhysicalLimitations(limitations: UserAIContext['physical_limitations']): string {
  if (Object.keys(limitations).length === 0) return ''
  return (
    '**Limitations fonctionnelles declarees (hors blessures)** : ' +
    JSON.stringify(limitations) +
    '\nAdapte les mouvements et amplitudes sans diagnostic ; les blessures et leurs restrictions priment.'
  )
}
