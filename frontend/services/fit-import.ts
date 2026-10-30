// Toujours passer par le rewrite Next.js (/api -> BACKEND_URL, voir next.config.ts)
// pour que le cookie JWT httpOnly reste same-origin (voir apiClient.ts)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface HrZoneData {
  zone: number
  label: string
  seconds: number
  high_bpm: number | null
}

/** Un tour enregistré par la montre : une fraction ou une récupération (voir backend fit-import/fit-laps.ts) */
export interface FitLap {
  index: number
  duration_seconds: number | null
  distance_meters: number | null
  avg_pace_min_km: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  /** active, rest, warmup, cooldown, recovery, interval… selon la montre */
  intensity: string | null
}

// Format enrichi par activité pour /parse-multiple
export interface FitActivity {
  /** Heure de départ (ISO). Absente des séances importées avant son ajout */
  start_time?: string | null
  sport: string | null
  duration_seconds: number | null
  calories: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  min_heart_rate: number | null
  distance_meters: number | null
  avg_temperature: number | null
  avg_cadence: number | null
  avg_power: number | null
  max_power: number | null
  avg_pace_min_km: number | null
  hr_zones: HrZoneData[] | null
  /** Absent des séances importées avant l'extraction des tours */
  laps?: FitLap[]
}

export interface MultiActivityFitData {
  activities: FitActivity[]
  totals: {
    duration_seconds: number
    calories: number | null
    distance_meters: number | null
    avg_power: number | null
    hr_zones: HrZoneData[] | null
    hr_max_reference: HrMaxReference | null
  }
}

/** FC max qui a servi au calcul des zones : profil, sinon 220 − âge, sinon le max de la séance (zones surestimées) */
export interface HrMaxReference {
  bpm: number
  source: 'profile' | 'age' | 'session'
}

export function describeHrMaxReference(reference: HrMaxReference | null | undefined): string | null {
  if (!reference) return null
  switch (reference.source) {
    case 'profile':
      return `Calculées sur ta FC max (${reference.bpm} bpm, profil)`
    case 'age':
      return `Calculées sur une FC max estimée à ${reference.bpm} bpm (220 − âge). Renseigne ta FC max dans ton profil pour plus de précision.`
    case 'session':
      return `Calculées sur la FC la plus haute de la séance (${reference.bpm} bpm), faute de FC max ou de date de naissance dans ton profil : les zones hautes sont surestimées.`
  }
}

export function getSportLabel(sport: string | null, index: number, totalActivities: number): string {
  const isRun = sport?.toLowerCase().includes('run')
  const isBike = sport?.toLowerCase().includes('cycl') || sport?.toLowerCase().includes('bik')
  if (isBike) return 'Vélo'
  if (!isRun) return 'Force / Mouvements'
  // Départ / retour n'a de sens que pour une séance en plusieurs fichiers (ex. Murph)
  if (totalActivities === 1) return 'Course'
  const runActivities = Array.from({ length: totalActivities })
  const runIndex = runActivities
    .map((_, i) => i)
    .filter(i => i <= index)
    .length
  return runIndex === 1 ? 'Course (départ)' : 'Course (retour)'
}


// Même limite que le backend (FIT_MAX_FILE_SIZE dans fit-import.controller.ts)
export const FIT_MAX_FILE_SIZE = 5 * 1024 * 1024

/** Levée avant tout envoi : son message est affiché tel quel à l'utilisateur. */
export class FitFileTooLargeError extends Error {
  constructor(fileName: string) {
    super(`« ${fileName} » dépasse 5 Mo : ce n'est probablement pas un export de séance.`)
  }
}

export async function parseFitFiles(files: File[]): Promise<MultiActivityFitData> {
  const tooLarge = files.find(file => file.size > FIT_MAX_FILE_SIZE)
  if (tooLarge) throw new FitFileTooLargeError(tooLarge.name)

  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }

  const response = await fetch(`${API_URL}/fit-import/parse-multiple`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText)
    throw new Error(text || `Erreur ${response.status}`)
  }

  return response.json()
}
