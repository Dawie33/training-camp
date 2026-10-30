import { PerformanceDiagnosticSummary, RunningDiagnostic } from 'src/workouts/services/user-context.service'
import { buildDiagnosticPromptLines, formatDuration, formatPace, formatRunningLines } from './diagnostic-prompt'

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
  run_types: { continuous: 2, intervals: 1, stations: 1 },
  recent_pace_min_km: 5.17,
  pace_change_pct: 4.2,
  easy_zone_pct: 65,
  hard_zone_pct: 15,
  latest_stations: { segment_count: 8, spread_pct: 12.5, drift_pct: 9.4 },
  latest_laps: { segment_count: 6, drift_pct: -1.5 },
  hyrox_simulations: [
    { format: '8 × 1 km', count: 2, total_seconds: 4488, run_share_pct: 57, run_drift_pct: 14, delta_pct: -3.2 },
    { format: '4 × 1 km', count: 1, total_seconds: 2105, run_share_pct: 61, run_drift_pct: null, delta_pct: null },
  ],
}

describe('formatPace', () => {
  it('écrit l’allure au format montre', () => {
    expect(formatPace(5.17)).toBe('5:10')
    expect(formatPace(6)).toBe('6:00')
    expect(formatPace(4.99)).toBe('4:59')
  })
})

describe('formatDuration', () => {
  it('écrit une durée au format chrono, avec les heures seulement si besoin', () => {
    expect(formatDuration(4488)).toBe('1:14:48')
    expect(formatDuration(905)).toBe('15:05')
    expect(formatDuration(3600)).toBe('1:00:00')
  })
})

describe('formatRunningLines', () => {
  it('écrit le sens de l’évolution d’allure en toutes lettres', () => {
    const lines = formatRunningLines(running)

    expect(lines).toEqual([
      '- Volume : 24.5 km sur les 28 derniers jours (18 km les 28 jours d’avant)',
      '- Séances de course sur 28 jours : 2 sorties continues, 1 fractionné, 1 séance à stations',
      '- Allure moyenne des sorties continues sur 28 jours : 5:10 /km, +4.2 % vs les 28 jours d’avant (plus lent)',
      '- Temps de course par zone cardiaque : 65 % en zones 1-2 (facile), 15 % en zones 4-5 (intense)',
      '- Dernière séance à stations (format Hyrox, 8 segments de course) : 12.5 % d’écart d’allure entre le segment le plus rapide et le plus lent, allure +9.4 % du premier au dernier segment',
      '- Dernière sortie découpée (6 tours d’effort) : allure -1.5 % du premier au dernier tour (positif = ralentissement)',
      '- Simulation Hyrox 8 × 1 km (2 réalisées) : dernière en 1:14:48, 57 % du temps en course et 43 % aux stations, allure +14 % du 1er au dernier km ; -3.2 % vs la précédente du même format (plus rapide)',
      '- Simulation Hyrox 4 × 1 km (1 réalisée) : dernière en 35:05, 61 % du temps en course et 39 % aux stations ; première de ce format',
    ])
  })

  it('n’écrit que le volume et les types de séance quand le reste manque', () => {
    const lines = formatRunningLines({
      ...running,
      hyrox_simulations: [],
      recent_pace_min_km: null,
      pace_change_pct: null,
      easy_zone_pct: null,
      hard_zone_pct: null,
      latest_stations: null,
      latest_laps: null,
    })

    expect(lines).toHaveLength(2)
  })

  it('n’écrit pas de dérive pour une séance à stations dont l’ordre des segments est inconnu', () => {
    const lines = formatRunningLines({
      ...running,
      latest_stations: { segment_count: 5, spread_pct: 8, drift_pct: null },
    })

    expect(lines.find(line => line.includes('stations ('))).toBe(
      '- Dernière séance à stations (format Hyrox, 5 segments de course) : 8 % d’écart d’allure entre le segment le plus rapide et le plus lent'
    )
  })

  it('donne l’allure sans tendance quand la fenêtre précédente manque', () => {
    const lines = formatRunningLines({ ...running, pace_change_pct: null })

    expect(lines[2]).toBe('- Allure moyenne des sorties continues sur 28 jours : 5:10 /km')
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
