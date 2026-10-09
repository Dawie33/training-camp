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
    injuries: [],
    physical_limitations: {},
    equipment_available: [],
    training_preferences: {},
    recentSessions: [],
    recentAnalyses: [],
    activeSkills: [],
    completedSkillNames: [],
    progressionReports: [],
    diagnostic: {
      ratio_imbalances: [],
      underworked_domains: [],
      load_zone: null,
      load_change_pct: null,
      most_scaled_movements: [],
      benchmark_trends: [],
      sessions_per_week: 0,
      consistency_pct: 0,
    },
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

  it('1RM connus → les liste sans recalculer de ratio (le diagnostic est la seule source)', () => {
    const section = buildAthleteContextSection(
      buildContext({
        oneRepMaxes: [
          { lift: 'snatch', value: 70 },
          { lift: 'clean_and_jerk', value: 100 },
        ],
      }),
    )

    expect(section).toContain('- snatch : 70kg')
    expect(section).not.toContain('Ratios diagnostiques')
    expect(section).not.toContain('Déséquilibres de force mesurés')
  })

  it('déséquilibre trop haut dans le diagnostic → affiché avec son sens et sa lecture', () => {
    const section = buildAthleteContextSection(
      buildContext({
        diagnostic: {
          ...buildContext().diagnostic,
          ratio_imbalances: [
            {
              label: 'Clean & Jerk / Back Squat',
              value_pct: 90,
              target: '70-75 %',
              direction: 'above',
              reading: 'C&J proche du back squat : c\'est la force maximale qu\'il faut monter.',
            },
          ],
        },
      }),
    )

    expect(section).toContain('Déséquilibres de force mesurés')
    expect(section).toContain('Clean & Jerk / Back Squat : 90 %, trop haut (cible 70-75 %)')
    expect(section).toContain('force maximale')
  })

  it('consigne : les déséquilibres de force se travaillent dans le bloc force, un seul par séance', () => {
    const section = buildAthleteContextSection(buildContext())

    expect(section).toContain('jamais dans le metcon')
    expect(section).toContain('UN SEUL déséquilibre')
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

  it('réserve le gainage isolé au type core : pas d\'abdos en finisher ni en accessoire de force', () => {
    const prompt = buildCrossFitSystemPrompt()

    expect(prompt).toContain('### core')
    expect(prompt).toContain('Finisher optionnel (5 min) : cardio uniquement')
    expect(prompt).not.toContain('abs/cardio')
    expect(prompt).toContain('PAS de gainage isolé')
  })

  it('fait primer les contraintes de l\'athlète sur le travail technique, y compris dans le scaling', () => {
    const prompt = buildCrossFitSystemPrompt()

    expect(prompt).toContain('Hiérarchie des consignes')
    expect(prompt).toContain('supprime le travail technique plutôt que d\'enfreindre la contrainte')
    expect(prompt).toContain('Les options de scaling respectent aussi les contraintes')
  })

  it('calcule le cap des For Time / Chipper depuis le volume plutôt qu\'une fourchette fixe', () => {
    const prompt = buildCrossFitSystemPrompt()

    expect(prompt).toContain('cap = ce total + 10-20 %')
    expect(prompt).not.toContain('cap time estimé (15-25 min selon volume)')
    expect(prompt).toContain('Walking lunges : 20 reps')
    expect(prompt).toContain('Sit-ups : 25 reps')
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

  it('workoutType core → impose la structure tronc et plafonne la durée à 45 min', () => {
    const prompt = buildCrossFitWorkoutPrompt({
      workoutType: 'core',
      duration: 60,
      difficulty: 'intermediate',
    })

    expect(prompt).toContain('Séance tronc/gainage')
    expect(prompt).toContain('anti-extension, anti-rotation, anti-inclinaison latérale')
    expect(prompt).toContain('35-45 min maximum')
    expect(prompt).toContain('workout_type = "core"')
  })

  it('contraintes de l\'athlète → en tête du prompt, rappelées à la fin pour la vérification finale', () => {
    const prompt = buildCrossFitWorkoutPrompt({
      workoutType: 'conditioning',
      duration: 45,
      difficulty: 'intermediate',
      athleteConstraints: 'pas de saut',
    })

    expect(prompt).toContain('CONTRAINTES DE L\'ATHLÈTE (PRIORITAIRES)')
    expect(prompt.indexOf('pas de saut')).toBeLessThan(prompt.indexOf('**Type de workout**'))
    expect(prompt).toContain('vérifie chaque exercice ET chaque option de scaling contre les contraintes de l\'athlète : "pas de saut"')
  })

  it('sans contraintes → ni bloc prioritaire ni vérification finale', () => {
    const prompt = buildCrossFitWorkoutPrompt({ workoutType: 'conditioning', duration: 45, difficulty: 'intermediate' })

    expect(prompt).not.toContain('CONTRAINTES DE L\'ATHLÈTE')
    expect(prompt).not.toContain('vérifie chaque exercice')
  })
})
