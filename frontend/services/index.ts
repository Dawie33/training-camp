// ============================================================================
// API Index - Point d'entrée centralisé pour tous les services API
// ============================================================================

// Core API exports
export { default as apiClient, ApiError } from './apiClient'
export { default as ResourceApi } from './resourceApi'

// Auth
export * from './auth'

// Workouts
export * from './workouts'

// Sessions
export * from './sessions'

// Schedule
export * from './schedule'

// Exercises
export * from './exercises'

// Equipments
export * from './equipments'

// Users
export * from './users'

// One Rep Maxes
export * from './one-rep-maxes'

// Activities (unified multi-module calendar)
export * from './activities'

// Analytics (diagnostic de performance calculé)
export * from './analytics'

// Types
export * from './types'
