import { normalizeMovementName, resolveMovementKey } from './lift-aliases'
import { computeMovementExposure, LoggedExercise } from './movement-exposure'

/** Une séance distincte par entrée : le cas le plus courant, un mouvement par séance. */
const separateSessions = (items: Omit<LoggedExercise, 'session_index'>[]): LoggedExercise[] =>
  items.map((item, index) => ({ ...item, session_index: index }))

describe('computeMovementExposure', () => {
  const find = (result: ReturnType<typeof computeMovementExposure>, name: string) =>
    result.movements.find(m => m.name === name)!

  it('agrège expositions, reps et charges par mouvement', () => {
    const result = computeMovementExposure(
      separateSessions([
        { name: 'Thruster', section_type: 'metcon', load_kg: 40, reps_completed: 30, scaled: false },
        { name: 'Thruster', section_type: 'for_time', load_kg: 45, reps_completed: 21, scaled: false },
      ])
    )

    const thruster = find(result, 'Thruster')
    expect(thruster.exposures).toBe(2)
    expect(thruster.total_reps).toBe(51)
    expect(thruster.avg_load_kg).toBe(42.5)
    expect(thruster.max_load_kg).toBe(45)
    expect(thruster.load_source).toBe('metcon')
  })

  it('exprime la charge moyenne en pourcentage du 1RM', () => {
    const result = computeMovementExposure(
      separateSessions([
        { name: 'Back Squat', section_type: 'strength', load_kg: 90, reps_completed: 15, scaled: false },
      ]),
      { back_squat: 150 }
    )

    expect(find(result, 'Back Squat').pct_of_1rm).toBe(60)
  })

  it('reste exploitable sans 1RM correspondant', () => {
    const result = computeMovementExposure(
      separateSessions([{ name: 'Wall Ball', section_type: 'metcon', load_kg: 9, reps_completed: 60, scaled: false }])
    )

    const wallBall = find(result, 'Wall Ball')
    expect(wallBall.pct_of_1rm).toBeNull()
    expect(wallBall.exposures).toBe(1)
  })

  it('rapproche les variantes d’écriture d’un même mouvement', () => {
    const result = computeMovementExposure(
      separateSessions([
        { name: 'Back Squat', section_type: 'strength', load_kg: 100, scaled: false },
        { name: 'back squat', section_type: 'strength', load_kg: 110, scaled: false },
        { name: 'Back-Squat', section_type: 'strength', load_kg: 120, scaled: false },
      ])
    )

    expect(result.movements).toHaveLength(1)
    expect(result.movements[0].exposures).toBe(3)
  })

  it('signale les mouvements scalés plus d’une fois sur deux', () => {
    const result = computeMovementExposure(
      separateSessions([
        { name: 'Ring Muscle Up', scaled: true },
        { name: 'Ring Muscle Up', scaled: true },
        { name: 'Ring Muscle Up', scaled: false },
        { name: 'Air Squat', scaled: false },
        { name: 'Air Squat', scaled: false },
        { name: 'Air Squat', scaled: false },
      ])
    )

    expect(result.most_scaled).toEqual(['Ring Muscle Up'])
    expect(find(result, 'Ring Muscle Up').scaled_pct).toBe(67)
  })

  it('ne conclut pas sur un mouvement vu moins de trois fois', () => {
    const result = computeMovementExposure(
      separateSessions([
        { name: 'Handstand Walk', scaled: true },
        { name: 'Handstand Walk', scaled: true },
      ])
    )

    expect(result.most_scaled).toEqual([])
  })

  it('classe les mouvements du plus exposé au moins exposé', () => {
    const result = computeMovementExposure(
      separateSessions([
        { name: 'Snatch', scaled: false },
        { name: 'Pull Up', scaled: false },
        { name: 'Pull Up', scaled: false },
      ])
    )

    expect(result.movements[0].name).toBe('Pull Up')
  })

  it('signale l’indisponibilité sans aucun exercice structuré', () => {
    const result = computeMovementExposure([])

    expect(result.available).toBe(false)
    expect(result.movements).toEqual([])
  })

  describe('mouvement dans plusieurs sections d’une séance', () => {
    // Le cas du contrat de SessionResultsSchema : Thruster en force puis en metcon, même séance
    const forceThenMetcon: LoggedExercise[] = [
      { name: 'Thruster', section_type: 'strength', session_index: 0, load_kg: 70, scaled: false },
      { name: 'Thruster', section_type: 'metcon', session_index: 0, load_kg: 42.5, reps_completed: 30, scaled: false },
    ]

    it('compte une seule exposition et calcule le % du 1RM sur la charge de force', () => {
      const thruster = find(computeMovementExposure(forceThenMetcon, { thruster: 80 }), 'Thruster')

      expect(thruster.exposures).toBe(1)
      expect(thruster.avg_load_kg).toBe(70)
      expect(thruster.max_load_kg).toBe(70)
      expect(thruster.pct_of_1rm).toBe(88)
      expect(thruster.load_source).toBe('strength')
      expect(thruster.total_reps).toBe(30)
    })

    it('compte la séance comme scalée si une de ses sections l’est', () => {
      const sessions: LoggedExercise[] = [0, 1, 2].flatMap(session_index => [
        { name: 'Thruster', section_type: 'strength', session_index, load_kg: 70, scaled: false },
        { name: 'Thruster', section_type: 'metcon', session_index, load_kg: 35, scaled: true },
      ])

      const result = computeMovementExposure(sessions)

      expect(find(result, 'Thruster').scaled_count).toBe(3)
      expect(find(result, 'Thruster').scaled_pct).toBe(100)
      expect(result.most_scaled).toEqual(['Thruster'])
    })
  })

  it('ignore les charges d’échauffement et d’accessoires', () => {
    const result = computeMovementExposure([
      { name: 'Deadlift', section_type: 'warmup', session_index: 0, load_kg: 40, scaled: false },
      { name: 'Deadlift', section_type: 'accessory', session_index: 1, load_kg: 60, scaled: false },
    ])

    const deadlift = find(result, 'Deadlift')
    expect(deadlift.exposures).toBe(2)
    expect(deadlift.avg_load_kg).toBeNull()
    expect(deadlift.load_source).toBeNull()
  })

  it('relie les noms courants et français au 1RM du lift, et les regroupe', () => {
    const result = computeMovementExposure(
      separateSessions([
        { name: 'Clean & Jerk', section_type: 'strength', load_kg: 80, scaled: false },
        { name: 'Épaulé-jeté', section_type: 'strength', load_kg: 90, scaled: false },
      ]),
      { clean_and_jerk: 100 }
    )

    expect(result.movements).toHaveLength(1)
    expect(result.movements[0]).toMatchObject({ name: 'Clean & Jerk', exposures: 2, pct_of_1rm: 85 })
  })
})

describe('resolveMovementKey', () => {
  it('renvoie la clé du lift pour ses alias', () => {
    expect(resolveMovementKey('Clean & Jerk')).toBe('clean_and_jerk')
    expect(resolveMovementKey('C&J')).toBe('clean_and_jerk')
    expect(resolveMovementKey('Épaulé-jeté')).toBe('clean_and_jerk')
    expect(resolveMovementKey('Squat Clean')).toBe('clean')
    expect(resolveMovementKey('Arraché')).toBe('snatch')
    expect(resolveMovementKey('Développé militaire')).toBe('strict_press')
  })

  it('ne rapporte pas les versions power au 1RM de la version complète', () => {
    expect(resolveMovementKey('Power Clean')).toBe('power_clean')
    expect(resolveMovementKey('Power Snatch')).toBe('power_snatch')
  })

  it('garde le nom normalisé d’un mouvement sans 1RM', () => {
    expect(resolveMovementKey('Wall Ball')).toBe(normalizeMovementName('Wall Ball'))
  })
})
