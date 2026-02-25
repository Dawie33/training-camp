# Training Camp — CLAUDE.md

Application full-stack de cross-training multi-sport avec génération de workouts par IA.

## Structure

Monorepo avec deux workspaces :
- `frontend/` — Next.js 16, React 19, App Router
- `backend/` — NestJS 11, PostgreSQL, Knex.js

## Stack

### Frontend
- Next.js 16 (App Router), React 19, TypeScript 5
- TailwindCSS 3.4, Radix UI, Lucide React
- TanStack Table, Recharts, Framer Motion
- Sonner (toasts), @schedule-x (calendar), next-pwa
- Path alias : `@/*` → `frontend/src/*`

### Backend
- NestJS 11, TypeScript 5.7
- PostgreSQL 15 via Knex.js (query builder + migrations)
- JWT (Passport.js), class-validator/class-transformer (DTOs)
- OpenAI API (génération de workouts), Zod/Joi
- Préfixe API : `/api`

### Base de données
- PostgreSQL 15 (Docker, port 5434)
- Migrations Knex.js versionnées dans `backend/database/migrations/`
- Seeds dans `backend/database/seeds/`
- UUID via pgcrypto, snake_case pour les colonnes

## Commandes

```bash
# Développement
npm run dev              # Frontend + backend en parallèle
npm --workspace frontend run dev   # Frontend seul (Turbopack)
npm --workspace backend run start:dev  # Backend seul (watch)

# Base de données
npm run db:up            # Démarrer PostgreSQL Docker
npm run db:down          # Arrêter Docker
npm run db:reset         # Reset Docker volumes
npm --workspace backend run db:migrate   # Appliquer migrations
npm --workspace backend run db:rollback  # Rollback migrations
npm --workspace backend run db:seed      # Seeder les données
npm --workspace backend run db:reset     # Rollback + migrate + seed

# Tests
npm --workspace backend run test         # Jest (backend)
npm --workspace backend run test:watch   # Jest watch
npm --workspace backend run test:cov     # Couverture

# Qualité
npm --workspace frontend run lint        # ESLint frontend
npm --workspace frontend run lint:fix    # ESLint fix
npm --workspace backend run format       # Prettier backend
```

## Conventions de code

### Style (Prettier)
- Pas de semicolons (`semi: false`)
- Single quotes
- 2 espaces, pas de tabs
- Trailing commas ES5
- 120 chars par ligne
- LF line endings

### Nommage
- **Fichiers** : kebab-case (`auth.controller.ts`, `user-workouts.ts`)
- **Classes/Types** : PascalCase (`AuthService`, `CreateWorkoutDto`)
- **Variables/fonctions** : camelCase
- **DB columns** : snake_case (`first_name`, `created_at`)
- **Enums** : PascalCase

### TypeScript
- Strict mode activé (backend)
- Pas de `any` implicite
- Decorators activés (backend, NestJS)

## Architecture backend (NestJS)

Structure standard par module :
```
module/
├── {module}.module.ts
├── {module}.controller.ts
├── {module}.service.ts
├── dto/           # Validation avec class-validator
├── schemas/       # Zod schemas
└── types/         # Interfaces TypeScript
```

Modules existants : `auth`, `users`, `workouts`, `workout-sessions`, `skills`, `exercises`, `equipments`, `healthcheck`, `database-config`

Guards : `@UseGuards(JwtAuthGuard)` sur les routes protégées.

## Architecture frontend (Next.js App Router)

```
app/              # Pages (App Router)
components/       # Composants réutilisables
  auth/           # Auth components
  ui/             # Wrappers Radix UI
  guards/         # Route guards
  workout/        # Workout-specific
  calendar/       # Calendar
  layout/         # Layout components
services/         # Clients API (un fichier par domaine)
hooks/            # Custom hooks (useAuth, etc.)
```

- `'use client'` pour les composants interactifs
- Server Components pour les layouts/pages statiques
- Appels API directs au backend (pas de routes Next.js API)

## Base de données — tables principales

`users`, `exercises`, `equipments`, `user_equipments`, `workouts`, `workout_exercises`, `user_workouts`, `personalized_workouts`, `workout_logs`, `workout_sessions`, `training_programs`, `user_program_enrollments`, `user_workout_schedule`, `one_rep_maxes`, `skill_programs`, `skill_program_steps`, `skill_progress_logs`

## Environnement

**Backend `.env`** (port 5434, pas 5432) :
```
DATABASE_HOST=localhost
DATABASE_PORT=5434
DATABASE_NAME=training_camp
DATABASE_USER=postgres
DATABASE_PASSWORD=...
JWT_SECRET=...
OPENAI_API_KEY=...
PORT=3001
NODE_ENV=development
```

## Workflow recommandé

1. `npm run db:up` → démarrer la DB
2. `npm run dev` → démarrer l'application
3. Après modification du schéma : créer une migration Knex (`db:migrate:make`)
4. Lancer les tests après chaque changement backend
5. Vérifier le lint avant de commiter
