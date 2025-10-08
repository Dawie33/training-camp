export interface WorkoutBlock {
  title?: string
  duration_min?: number
  exercises?: Array<{
    name: string
    description?: string
    category?: string
    measurement_type?: string
    sets?: string
    reps?: string
    weight?: string
    distance?: string
    time?: string
    duration?: string
    equipment?: string | string[]
    muscle_groups?: string[]
    instructions?: string
    notes?: string
  }>
}

export interface WorkoutBlocks {
  warmup?: WorkoutBlock
  main?: WorkoutBlock
  metcon?: WorkoutBlock
  cooldown?: WorkoutBlock
  strength?: WorkoutBlock
  accessory?: WorkoutBlock
  duration_min?: number
  [key: string]: WorkoutBlock | number | undefined
}
