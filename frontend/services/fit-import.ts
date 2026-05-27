const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface HrZoneData {
  zone: number
  label: string
  seconds: number
  high_bpm: number | null
}

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

export async function parseFitFiles(files: File[]): Promise<ParsedFitData> {
  if (files.length === 1) return parseFitFile(files[0])

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
