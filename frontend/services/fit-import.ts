// Toujours passer par le rewrite Next.js (/api -> BACKEND_URL, voir next.config.ts)
// pour que le cookie JWT httpOnly reste same-origin (voir apiClient.ts)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface HrZoneData {
  zone: number
  label: string
  seconds: number
  high_bpm: number | null
}

// Format enrichi par activité pour /parse-multiple
export interface FitActivity {
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
}

export interface MultiActivityFitData {
  activities: FitActivity[]
  totals: {
    duration_seconds: number
    calories: number | null
    distance_meters: number | null
    avg_power: number | null
    hr_zones: HrZoneData[] | null
  }
}

export function getSportLabel(sport: string | null, index: number, totalActivities: number): string {
  const isRun = sport?.toLowerCase().includes('run')
  const isBike = sport?.toLowerCase().includes('cycl') || sport?.toLowerCase().includes('bik')
  if (isBike) return 'Vélo'
  if (!isRun) return 'Force / Mouvements'
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
