import { describeEffort, describeRx, describeScore } from './session-performance'

describe('Session performance prompt', () => {
  it('décrit le chrono, le cap et la progression réellement saisie', () => {
    expect(describeScore({ elapsed_time_seconds: 425 })).toContain('7m5s')
    expect(describeScore({ cap_reached: true, rounds_completed: 0, partial_note: '12 thrusters' })).toContain(
      'Rounds terminés : 0\n- Progression au cap : 12 thrusters'
    )
  })

  it('lit les rounds et les splits même quand seul un bloc du workout est AMRAP', () => {
    expect(describeScore({ rounds: 0, reps: 12 })).toContain('0 rounds + 12 reps')
    expect(describeScore({ split_time_seconds: 190, reps_after_split: 0 })).toContain('190s ; puis 0 reps')
  })

  it('ne prétend pas connaître le RX sans exercices structurés', () => {
    expect(describeRx({})).toBe('Non renseigné')
    expect(describeRx({ exercise_results: [] })).toBe('Non renseigné')
    expect(describeRx({ exercise_results: [{ name: 'Run', section_type: 'metcon', scaled: false }] })).toBe('Oui')
  })

  it('transmet scaling, charges, reps, séries et ressenti', () => {
    const description = describeEffort({
      rpe: 9,
      rating: 4,
      session_duration_minutes: 60,
      exercise_results: [
        {
          name: 'Thruster',
          section_type: 'metcon',
          scaled: true,
          scaling_note: 'charge réduite',
          load_kg: 30,
          reps_completed: 21,
          sets_completed: 3,
        },
      ],
    })
    for (const value of ['Non (Scaled)', '9/10', '4/5', '60 min', '30 kg', '21 reps', '3 séries', 'charge réduite']) {
      expect(description).toContain(value)
    }
  })
})
