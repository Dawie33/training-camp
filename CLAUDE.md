# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Application full-stack de cross-training multi-sport avec génération de workouts par IA.

## Structure

Monorepo npm workspaces :
- `frontend/` — Next.js 16, React 19, App Router
- `backend/` — NestJS 11, PostgreSQL, Knex.js

## Stack

### Frontend
- Next.js 16 (App Router), React 19, TypeScript 5
- TailwindCSS 3.4, Radix UI, Lucide React
- TanStack Table, Recharts, Framer Motion
- Sonner (toasts), @schedule-x (calendar), next-pwa
- Path alias : `@/*` → `frontend/*` (pas de `src/`)

### Backend
- NestJS 11, TypeScript 5.7
- PostgreSQL 15 via Knex.js (query builder + migrations)
- JWT (Passport.js), class-validator/class-transformer (DTOs)
- OpenAI API (`gpt-4o`, `json_object`, Zod validation)
- Préfixe API : `/api`

### Base de données
- PostgreSQL 15 (Docker, port **5434**)
- Migrations Knex.js dans `backend/src/database/migrations/`
- Seeds dans `backend/src/database/seeds/`
- UUID via pgcrypto, snake_case pour les colonnes

## Commandes

```bash
# Développement
npm run dev                                              # Frontend + backend en parallèle
npm --workspace frontend run dev                         # Frontend seul (Turbopack)
npm --workspace backend run start:dev                    # Backend seul (watch)

# Base de données
npm run db:up                                            # Démarrer PostgreSQL Docker
npm run db:down                                          # Arrêter Docker
npm run db:reset                                         # Reset Docker volumes
npm --workspace backend run db:migrate                   # Appliquer migrations
npm --workspace backend run db:rollback                  # Rollback migrations
npm --workspace backend run db:seed                      # Seeder les données
npm --workspace backend run db:reset                     # Rollback + migrate + seed
npm --workspace backend run db:migrate:make -- <name>    # Créer une nouvelle migration

# Tests
npm --workspace backend run test                         # Jest (backend)
npm --workspace backend run test:watch                   # Jest watch
npm --workspace backend run test:cov                     # Couverture
npm --workspace backend run test:e2e                     # Tests e2e

# Qualité
npm --workspace frontend run lint                        # ESLint frontend
npm --workspace frontend run lint:fix                    # ESLint fix
npm --workspace backend run format                       # Prettier backend
npm --workspace backend run build                        # Vérifier TS backend
```

## Workflow recommandé

1. `npm run db:up` → démarrer la DB
2. `npm run dev` → démarrer l'application
3. Après modification du schéma : `npm --workspace backend run db:migrate:make -- <nom>` puis éditer la migration
4. Lancer les tests après chaque changement backend
5. Vérifier le lint avant de commiter (`npm --workspace frontend run lint` + `npm --workspace backend run build`)

## Conventions de code

### Style (Prettier)
- Pas de semicolons (`semi: false`)
- Single quotes, 2 espaces, trailing commas ES5
- 120 chars par ligne, LF line endings

### Nommage
- **Fichiers** : kebab-case (`auth.controller.ts`, `user-workouts.ts`)
- **Classes/Types** : PascalCase
- **Variables/fonctions** : camelCase
- **DB columns** : snake_case (`first_name`, `created_at`)

### TypeScript
- Strict mode activé (backend), pas de `any` implicite
- Decorators activés (backend, NestJS)

## Architecture backend (NestJS)

Structure par module — les modules simples sont plats, les modules complexes utilisent des sous-dossiers :

```
module/
├── {module}.module.ts
├── {module}.controller.ts   # ou controllers/ si plusieurs
├── {module}.service.ts      # ou services/ si plusieurs
├── dto/                     # Validation avec class-validator
├── schemas/                 # Zod schemas
├── prompts/                 # Prompts IA (si applicable)
└── types/                   # Interfaces TypeScript
```

Guards : `@UseGuards(JwtAuthGuard)` sur toutes les routes protégées.

### Modules existants

| Module | Responsabilité |
|---|---|
| `auth` | JWT login/register, Passport strategies |
| `users` | Profil utilisateur, équipements, préférences |
| `workouts` | CRUD workouts + génération IA + scheduling |
| `workout-sessions` | Log de sessions + analyse IA post-workout |
| `skills` | Programmes de compétences gymnastics/weightlifting |
| `exercises` | Référentiel d'exercices |
| `equipments` | Équipements disponibles |
| `one-rep-maxes` | Maxes et historique |
| `training-programs` | Programmes structurés multi-semaines |
| `google-calendar` | Sync agenda Google |

### Pattern génération IA

Trois services OpenAI distincts, chacun avec son fichier de prompt et son schéma Zod :

- `ai-workout-generator.service.ts` — génère les WODs (dans `WorkoutsModule`)
- `ai-skill-generator.service.ts` — génère les programmes de compétences (dans `SkillsModule`)
- `ai-program-generator.service.ts` — génère les programmes d'entraînement (dans `TrainingProgramsModule`)
- `workout-analysis.service.ts` — analyse les sessions post-workout (dans `WorkoutSessionsModule`)

Toutes les interactions OpenAI utilisent `model: 'gpt-4o'`, `response_format: json_object`, et valident la réponse avec Zod. Si l'IA retourne `{"error": "UNKNOWN_WOD"}` sur un lookup de WOD, lever une `BadRequestException`.

### UserContextService

Exporté depuis `WorkoutsModule`. Fournit le contexte utilisateur complet aux services IA : 1RMs, équipements, sessions récentes, analyses récentes, compétences actives (`ActiveSkillContext`). À injecter dans tout nouveau service IA.

## Architecture frontend (Next.js App Router)

```
frontend/
├── app/
│   ├── (app)/          # Routes protégées (layout avec nav)
│   │   ├── calendar/
│   │   ├── dashboard/
│   │   ├── workouts/
│   │   ├── training-programs/
│   │   ├── skills/
│   │   └── ...
│   └── (public)/       # Routes publiques (login, signup)
├── components/         # Composants réutilisables (ui/, workout/, calendar/, layout/)
├── services/           # Clients API (un fichier par domaine)
├── hooks/              # Custom hooks globaux
├── contexts/           # React contexts (AuthContext, WorkoutTimerContext)
└── domain/entities/    # Types partagés
```

- `'use client'` pour les composants interactifs, Server Components pour les layouts/pages statiques
- Appels API directs au backend via `apiClient` (jamais de routes Next.js API)
- Pattern page : `page.tsx` → `_hooks/` → `_components/` (co-localisation dans le dossier de la page)
- Token JWT dans `localStorage` (`access_token`), injecté automatiquement par `apiClient`

### Services frontend

`frontend/services/apiClient.ts` — client HTTP de base (GET/POST/PATCH/PUT/DELETE), gère les headers JWT automatiquement.

`frontend/services/resourceApi.ts` — factory de clients CRUD génériques, à réutiliser pour les nouvelles ressources.

Un fichier service par domaine : `workouts.ts`, `sessions.ts`, `skills.ts`, `schedule.ts`, `one-rep-maxes.ts`, etc.

### Deux flux de log de workout distincts

- **`LogWorkoutModal`** (`components/calendar/`) — log depuis le calendrier, appelle l'API backend (`sessionService` + `scheduleApi`). Supporte for_time (avec cap atteint), amrap, libre.
- **`WorkoutResultModal`** (`components/workout/`) — log depuis le timer intégré, utilise `WorkoutHistoryService` (localStorage). Flow séparé, non connecté à l'API sessions.

## Base de données — tables principales

`users`, `exercises`, `equipments`, `user_equipments`, `workouts`, `workout_exercises`, `user_workouts`, `personalized_workouts`, `workout_logs`, `workout_sessions`, `training_programs`, `user_program_enrollments`, `user_workout_schedule`, `one_rep_maxes`, `one_rep_max_history`, `skill_programs`, `skill_program_steps`, `skill_progress_logs`

## Environnement

**Backend `.env`** :
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

**Frontend `.env.local`** :
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

En production, le backend est déployé sur Render (`https://training-camp-backend.onrender.com/api`).

## Pièges connus

- `npm run dev` lance frontend + backend via `concurrently`. Ne pas laisser tourner un backend séparé en parallèle (conflit port 3001).
- `turbopack: { root: '../' }` dans `next.config.ts` provoque des redémarrages intempestifs du backend en watch mode — ne pas le remettre.
- Les migrations Knex sont dans `backend/src/database/migrations/` (pas `backend/database/`).
- GPT-4o ne connaît pas les workouts CrossFit Open postérieurs à début 2025. Utiliser le champ `referenceData` du endpoint `POST /workouts/lookup` pour injecter les détails exacts.
- La DB écoute sur le port **5434** (pas 5432 par défaut).
