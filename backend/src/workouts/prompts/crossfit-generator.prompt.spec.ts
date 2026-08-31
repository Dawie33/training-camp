import { buildAthleteContextSection, buildCrossFitSystemPrompt, buildCrossFitWorkoutPrompt } from './crossfit-generator.prompt'
import { UserAIContext } from '../services/user-context.service'

/**
 * Construit un UserAIContext minimal valide, surchargeable par test.
 */
function buildContext(overrides: Partial<UserAIContext> = {}): UserAIContext {
  return {
    sport_level: 'intermediate',
    oneRepMaxes: [],
    benchmarkResults: {},
    global_goals: {},
    injuries: {},
    physical_limitations: {},
    equipment_available: [],
    training_preferences: {},
    recentSessions: [],
    recentAnalyses: [],
    activeSkills: [],
    progressionReports: [],
    ...overrides,
  }
}

describe('buildAthleteContextSection', () => {
  it('sans 1RM ni séances récentes → pas de section ratios ni de règle de microcycle', () => {
    const section = buildAthleteContextSection(buildContext())

    expect(section).toContain('Niveau')
    expect(section).not.toContain('Ratios diagnostiques')
    expect(section).not.toContain('Règle du microcycle')
  })

  it('snatch faible par rapport au clean & jerk (< 78%) → alerte affichée', () => {
    const section = buildAthleteContextSection(
      buildContext({
        oneRepMaxes: [
          { lift: 'snatch', value: 70 },
          { lift: 'clean_and_jerk', value: 100 },
        ],
      }),
    )

    expect(section).toContain('Ratios diagnostiques')
    expect(section).toContain('Snatch / Clean & Jerk : 70%')
  })

  it('ratios tous dans les repères → aucune alerte affichée', () => {
    const section = buildAthleteContextSection(
      buildContext({
        oneRepMaxes: [
          { lift: 'snatch', value: 80 },
          { lift: 'clean_and_jerk', value: 100 },
          { lift: 'front_squat', value: 119 },
          { lift: 'back_squat', value: 140 },
          { lift: 'deadlift', value: 175 },
        ],
      }),
    )

    expect(section).not.toContain('Ratios diagnostiques')
  })

  it('clean & jerk trop proche du back squat (> 75%) → alerte force max', () => {
    const section = buildAthleteContextSection(
      buildContext({
        oneRepMaxes: [
          { lift: 'clean_and_jerk', value: 90 },
          { lift: 'back_squat', value: 100 },
        ],
      }),
    )

    expect(section).toContain('Clean & Jerk / Back Squat : 90%')
    expect(section).toContain('force max')
  })

  it('fallback sur "clean" quand "clean_and_jerk" est absent', () => {
    const section = buildAthleteContextSection(
      buildContext({
        oneRepMaxes: [
          { lift: 'snatch', value: 70 },
          { lift: 'clean', value: 100 },
        ],
      }),
    )

    expect(section).toContain('Snatch / Clean & Jerk : 70%')
  })

  it('un seul 1RM connu → ne calcule aucun ratio (pas de crash)', () => {
    const section = buildAthleteContextSection(buildContext({ oneRepMaxes: [{ lift: 'back_squat', value: 100 }] }))

    expect(section).not.toContain('Ratios diagnostiques')
  })

  it('séance récente présente → ajoute la règle anti-répétition de stress du microcycle', () => {
    const section = buildAthleteContextSection(
      buildContext({
        recentSessions: [{ date: '2026-08-30', sport: 'crossfit', workout_type: 'strength_max', duration_minutes: 60 }],
      }),
    )

    expect(section).toContain('Règle du microcycle')
  })
})

describe('buildCrossFitSystemPrompt', () => {
  it('inclut la table de Prilepin et les nouvelles règles de scaling', () => {
    const prompt = buildCrossFitSystemPrompt()

    expect(prompt).toContain('Table de Prilepin')
    expect(prompt).toContain('préserver le stimulus')
    expect(prompt).toContain('strict avant kipping')
  })

  it('sans équipement fourni → utilise le preset crossfit par défaut', () => {
    const prompt = buildCrossFitSystemPrompt()

    expect(prompt).toContain('ÉQUIPEMENT DISPONIBLE')
  })

  it('avec équipement fourni → l\'injecte dans la liste équipement disponible', () => {
    const prompt = buildCrossFitSystemPrompt(['barbell', 'rower'])

    expect(prompt).toContain('barbell')
    expect(prompt).toContain('rower')
  })

  it('avec contexte athlète → inclut le profil dans le prompt', () => {
    const prompt = buildCrossFitSystemPrompt(undefined, buildContext({ sport_level: 'advanced' }))

    expect(prompt).toContain('PROFIL DE L\'ATHLÈTE')
    expect(prompt).toContain('Avancé')
  })

  it('les blocs JSON d\'exemple embarqués dans le prompt restent syntaxiquement valides', () => {
    const prompt = buildCrossFitSystemPrompt()
    const jsonBlocks = [...prompt.matchAll(/```json\n([\s\S]*?)\n```/g)].map((m) => m[1])

    expect(jsonBlocks.length).toBeGreaterThan(0)
    for (const block of jsonBlocks) {
      expect(() => JSON.parse(block)).not.toThrow()
    }
  })
})

describe('buildCrossFitWorkoutPrompt', () => {
  it('workoutType benchmark avec benchmarkName → mentionne le nom du benchmark et RX/Scaled', () => {
    const prompt = buildCrossFitWorkoutPrompt({
      workoutType: 'benchmark',
      duration: 15,
      difficulty: 'intermediate',
      benchmarkName: 'Fran',
    })

    expect(prompt).toContain('Fran')
    expect(prompt).toContain('RX')
    expect(prompt).toContain('Scaled')
  })

  it('workoutType vo2max → impose un protocole et la structure obligatoire', () => {
    const prompt = buildCrossFitWorkoutPrompt({
      workoutType: 'vo2max',
      duration: 40,
      difficulty: 'advanced',
    })

    expect(prompt).toContain('Protocole VO2max imposé')
    expect(prompt).toContain('workout_type = "vo2max"')
  })
})
