// ============================================================================
// API Index - Point d'entrée centralisé pour tous les services API
// ============================================================================

// Core API exports
export { default as apiClient, ApiError } from './apiClient'
export { default as ResourceApi } from './resourceApi'

// Auth
export * from './auth'

// Sports
export * from './sports'

// Workouts
export * from './workouts'

// Sessions
export * from './sessions'

// Exercises
export * from './exercices'

// Equipments
export * from './equipments'

// Users
export * from './users'

// Types
export * from './types'
