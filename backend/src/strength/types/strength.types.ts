export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'forearms' | 'legs' | 'glutes' | 'core'

export type SessionGoal = 'strength' | 'hypertrophy' | 'endurance' | 'power'

export type BlockType = 'push' | 'pull' | 'hinge' | 'squat' | 'carry' | 'rotation' | 'isolation' | 'core'

export type BodyFocus = 'upper_body' | 'lower_body' | 'full_body'

export type TrainingStyle = 'traditional' | 'strongman'

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'arms', 'forearms', 'legs', 'glutes', 'core',
]

export const SESSION_GOALS: SessionGoal[] = ['strength', 'hypertrophy', 'endurance', 'power']

export const BODY_FOCUS_VALUES: BodyFocus[] = ['upper_body', 'lower_body', 'full_body']

export const TRAINING_STYLE_VALUES: TrainingStyle[] = ['traditional', 'strongman']
