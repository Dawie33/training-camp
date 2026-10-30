import { PerformanceDiagnosticSummary, RunningDiagnostic } from 'src/workouts/services/user-context.service'
import { buildDiagnosticPromptLines, formatPace, formatRunningLines } from './diagnostic-prompt'

const emptyDiagnostic: PerformanceDiagnosticSummary = {
  ratio_imbalances: [],
  underworked_domains: [],
  load_zone: null,
  load_change_pct: null,
  most_scaled_movements: [],
  benchmark_trends: [],
  sessions_per_week: 0,
  consistency_pct: 0,
  running: null,
}

const running: RunningDiagnostic = {
  last_28_days_km: 24.5,
  previous_28_days_km: 18,
  recent_pace_min_km: 5.17,
  pace_change_pct: 4.2,
  easy_zone_pct: 65,
  hard_zone_pct: 15,
  latest_stations: { segment_count: 8, spread_pct: 12.5 },
  latest_laps: { segment_count: 6, drift_pct: -1.5 },
}

describe('formatPace', () => {
  it('écrit l’allure au format montre', () => {
    expect(formatPace(5.17)).toBe('5:10')
    expect(formatPace(6)).toBe('6:00')
    expect(formatPace(4.99)).toBe('4:59')
  })
})

describe('formatRunningLines', () => {
  it('écrit le sens de l’évolution d’allure en toutes lettres', () => {
    const lines = formatRunningLines(running)

    expect(lines).toEqual([
      '- Volume : 24.5 km sur les 28 derniers jours (18 km les 28 jours d’avant)',
      '- Allure moyenne sur 28 jours : 5:10 /km, +4.2 % vs les 28 jours d’avant (plus lent)',
      '- Temps de course par zone cardiaque : 65 % en zones 1-2 (facile), 15 % en zones 4-5 (intense)',
      '- Dernière séance à stations (format Hyrox, 8 segments de course) : 12.5 % d’écart d’allure entre le segment le plus rapide et le plus lent',
      '- Dernière sortie découpée (6 tours d’effort) : allure -1.5 % du premier au dernier tour (positif = ralentissement)',
    ])
  })

  it('n’écrit que le volume quand le reste manque', () => {
    const lines = formatRunningLines({
      ...running,
      recent_pace_min_km: null,
      pace_change_pct: null,
      easy_zone_pct: null,
      hard_zone_pct: null,
      latest_stations: null,
      latest_laps: null,
    })

    expect(lines).toHaveLength(1)
  })

  it('donne l’allure sans tendance quand la fenêtre précédente manque', () => {
    const lines = formatRunningLines({ ...running, pace_change_pct: null })

    expect(lines[1]).toBe('- Allure moyenne sur 28 jours : 5:10 /km')
  })
})

describe('buildDiagnosticPromptLines', () => {
  it('ajoute la section course quand des courses ont été importées', () => {
    const lines = buildDiagnosticPromptLines({ ...emptyDiagnostic, running })

    expect(lines).toContain('### Course à pied (fichiers .fit)')
    expect(lines[1]).toContain('DIAGNOSTIC CALCULÉ')
  })

  it('n’ajoute rien sans course ni autre donnée', () => {
    expect(buildDiagnosticPromptLines(emptyDiagnostic)).toEqual([])
  })
})
