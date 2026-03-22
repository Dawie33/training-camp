# AGENTS.md - Training Camp

Full-stack cross-training app with AI-powered workout generation.

## Repository Structure

```
training-camp/
├── frontend/          # Next.js 16, React 19, App Router
├── backend/          # NestJS 11, TypeScript, Knex.js, PostgreSQL
└── package.json      # Workspace root (npm run dev starts both)
```

## Commands

### Development

```bash
npm run dev                    # Start frontend + backend (via concurrently)
npm run db:up                  # Start PostgreSQL via Docker (port 5434)
npm run db:down               # Stop PostgreSQL
npm run db:logs               # View PostgreSQL logs
npm run db:reset              # Reset database (delete volumes + recreate)
```

### Backend (run from backend/)

```bash
npm run start:dev              # NestJS watch mode
npm run build                  # Production build
npm run test                   # All tests
npm run test -- --testPathPattern=user.service  # Single test file
npm run test:watch            # Watch mode
npm run test:cov              # Coverage report
npm run lint                   # ESLint
npm run lint:fix              # Fix lint errors
npm run format                 # Prettier format
```

### Frontend (run from frontend/)

```bash
npm run dev                    # Next.js dev (Turbopack)
npm run build                  # Production build
npm run lint                   # Next.js lint
npm run lint:fix               # Fix lint errors
```

### Database Migrations (run from backend/)

```bash
npm run db:migrate:make -- <name>   # Create migration
npm run db:migrate                   # Run migrations
npm run db:rollback                 # Rollback last
npm run db:seed                     # Run seeds
npm run db:reset                    # Full reset
```

## Code Style

### Prettier Configuration

- No semicolons (`semi: false`)
- Single quotes
- 2 spaces, no tabs
- Trailing commas (ES5)
- 120 characters per line
- LF line endings

### Naming Conventions

| Type                | Convention | Example                                  |
| ------------------- | ---------- | ---------------------------------------- |
| Files               | kebab-case | `auth.controller.ts`, `user-workouts.ts` |
| Classes/Types       | PascalCase | `AuthService`, `CreateWorkoutDto`        |
| Variables/Functions | camelCase  | `getUserById`, `isActive`                |
| DB columns          | snake_case | `first_name`, `created_at`               |
| Enums               | PascalCase | `WorkoutType`                            |

### TypeScript Rules

- **Backend**: Strict mode enabled, no implicit `any`
- **Frontend**: `any` is a warning, unused vars must be prefixed with `_`
- Use decorators for NestJS (no decorator-style class syntax for other code)

### Import Organization

1. External libraries
2. Internal modules (using `@/` alias in frontend)
3. Relative imports
4. Type imports last

## Architecture

### Backend (NestJS)

Modules: `auth`, `users`, `workouts`, `workout-sessions`, `skills`, `exercises`, `equipments`, `google-calendar`, `one-rep-maxes`, `training-programs`, `healthcheck`, `database-config`

**Module structure**:

```
module/
├── {module}.module.ts
├── {module}.controller.ts   # or controllers/ if multiple
├── {module}.service.ts      # or services/ if multiple
├── dto/                     # class-validator validation
├── schemas/                 # Zod schemas
├── prompts/                 # AI prompts
└── types/                   # TypeScript interfaces
```

Protected routes use `@UseGuards(JwtAuthGuard)`.

AI generation: All OpenAI calls go through `callOpenAI()` in `backend/src/workouts/services/ai-workout-generator.service.ts`. Response validated by Zod.

### Frontend (Next.js App Router)

```
frontend/
├── app/
│   ├── (app)/          # Protected routes (with nav)
│   └── (public)/       # Public routes (login, register)
├── components/         # Reusable (ui/, auth/, workout/, calendar/)
├── services/           # API clients (one file per domain)
├── hooks/              # Global hooks (useAuth, useWorkoutTimer)
├── contexts/           # React contexts
├── domain/             # Shared types
└── lib/               # Utilities
```

- Use `'use client'` for interactive components
- Server Components for static pages/layouts
- API calls go directly to backend via `apiClient`
- JWT stored in `localStorage` as `access_token`

### Two Workout Logging Flows

1. **LogWorkoutModal** (`components/calendar/`) - From calendar, calls backend API
2. **WorkoutResultModal** (`components/workout/`) - From timer, uses localStorage

## Environment

**Backend** (`.env`, port 5434 NOT 5432):

```
DATABASE_HOST=localhost
DATABASE_PORT=5434
DATABASE_NAME=training_camp
PORT=3001
JWT_SECRET=...
OPENAI_API_KEY=...
```

**Frontend** (`.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Known Pitfalls

- Don't run separate backend while `npm run dev` is running (port conflict)
- Migrations are in `backend/src/database/migrations/` (not `backend/database/`)
- GPT-4o doesn't know CrossFit Open workouts after early 2025; use `referenceData` field in lookup API
- Don't add `turbopack: { root: '../' }` to next.config.ts (causes backend watch issues)

## Lint Before Commit

```bash
npm --workspace backend run lint
npm --workspace frontend run lint
npm --workspace backend run build
```
