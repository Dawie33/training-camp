import { extractLaps, MAX_LAPS } from './fit-laps'

// Tours tels que les renvoie fit-file-parser : secondes, mètres, type de tour en texte
const fraction = {
  total_timer_time: 130,
  total_elapsed_time: 130,
  total_distance: 400,
  avg_heart_rate: 168,
  max_heart_rate: 176,
  intensity: 'active',
}
const recovery = {
  total_timer_time: 90,
  total_elapsed_time: 90,
  total_distance: 210,
  avg_heart_rate: 150,
  max_heart_rate: 165,
  intensity: 'rest',
}

describe('extractLaps', () => {
  it('garde chaque fraction et chaque récupération, avec son allure', () => {
    // Act
    const laps = extractLaps([fraction, recovery], true)

    // Assert — 130 s sur 400 m = 5:25 /km
    expect(laps).toEqual([
      {
        index: 1,
        duration_seconds: 130,
        distance_meters: 400,
        avg_pace_min_km: 5.42,
        avg_heart_rate: 168,
        max_heart_rate: 176,
        intensity: 'active',
      },
      {
        index: 2,
        duration_seconds: 90,
        distance_meters: 210,
        avg_pace_min_km: 7.14,
        avg_heart_rate: 150,
        max_heart_rate: 165,
        intensity: 'rest',
      },
    ])
  })

  it("ne calcule pas d'allure hors course", () => {
    const laps = extractLaps([fraction, recovery], false)

    expect(laps.map(l => l.avg_pace_min_km)).toEqual([null, null])
  })

  it('prend le temps chronométré, qui exclut les pauses de la montre', () => {
    const paused = { ...fraction, total_timer_time: 130, total_elapsed_time: 190 }

    expect(extractLaps([paused, recovery], true)[0].duration_seconds).toBe(130)
  })

  it("ne garde rien d'une activité non découpée : son seul tour répète les totaux", () => {
    expect(extractLaps([fraction], true)).toEqual([])
    expect(extractLaps([], true)).toEqual([])
    expect(extractLaps(undefined, true)).toEqual([])
  })

  it(`s'arrête à ${MAX_LAPS} tours`, () => {
    const laps = extractLaps(
      Array.from({ length: MAX_LAPS + 20 }, () => fraction),
      true
    )

    expect(laps).toHaveLength(MAX_LAPS)
  })

  it('remplace une valeur absente ou invalide par null', () => {
    const broken = { total_timer_time: -5, total_distance: 'beaucoup', avg_heart_rate: Number.NaN, intensity: 3 }

    expect(extractLaps([broken, recovery], true)[0]).toEqual({
      index: 1,
      duration_seconds: null,
      distance_meters: null,
      avg_pace_min_km: null,
      avg_heart_rate: null,
      max_heart_rate: null,
      intensity: null,
    })
  })
})
