// Toujours passer par le rewrite Next.js (/api -> BACKEND_URL, voir next.config.ts)
// pour que le cookie JWT httpOnly reste same-origin (voir apiClient.ts)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface HrZoneData {
  zone: number
  label: string
  seconds: number
  high_bpm: number | null
}

// Format renvoyé par /parse (fichier unique, rétrocompat)
export interface ParsedFitData {
  duration_seconds: number | null
  calories: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  min_heart_rate: number | null
  distance_meters: number | null
  sport: string | null
  avg_temperature: number | null
  avg_cadence: number | null
  hr_zones: HrZoneData[] | null
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
  avg_pace_min_km: number | null
  hr_zones: HrZoneData[] | null
}

export interface MultiActivityFitData {
  activities: FitActivity[]
  totals: {
    duration_seconds: number
    calories: number | null
    distance_meters: number | null
    hr_zones: HrZoneData[] | null
  }
}

export function getSportLabel(sport: string | null, index: number, totalActivities: number): string {
  const isRun = sport?.toLowerCase().includes('run')
  if (!isRun) return 'Musculation / Mouvements'
  const runActivities = Array.from({ length: totalActivities })
  const runIndex = runActivities
    .map((_, i) => i)
    .filter(i => i <= index)
    .length
  return runIndex === 1 ? 'Course (départ)' : 'Course (retour)'
}


export async function parseFitFile(file: File): Promise<ParsedFitData> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/fit-import/parse`, {
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

export async function parseFitFiles(files: File[]): Promise<MultiActivityFitData> {
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
