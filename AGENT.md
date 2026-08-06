# AGENT.md

Instructions pour les agents IA autonomes intervenant sur ce dépôt.

## Résumé du projet

Training Camp est une application full-stack de cross-training multi-sport (cross-training, force, running, vélo, mobilité) qui génère des séances d'entraînement personnalisées via IA. Le dépôt est un monorepo npm workspaces avec un frontend Next.js et un backend NestJS/PostgreSQL.

## Structure du monorepo

```
training-camp/
├── frontend/   # Next.js 16, React 19, App Router (workspace "frontend")
├── backend/    # NestJS 11, PostgreSQL via Knex.js (workspace "backend")
└── docker-compose.yml  # PostgreSQL local (port 5432)
```

Les deux workspaces sont indépendants côté build mais communiquent en HTTP : le frontend appelle directement l'API backend via `apiClient` (pas de routes API Next.js).

## Commandes essentielles

```bash
npm install                                              # Installer les dépendances (racine, workspaces inclus)
npm run db:up                                             # Démarrer PostgreSQL (Docker)
npm run dev                                               # Frontend + backend en parallèle

npm --workspace backend run test                          # Tests Jest backend
npm --workspace backend run test:e2e                      # Tests e2e backend
npm --workspace backend run db:migrate                    # Appliquer les migrations
npm --workspace backend run db:migrate:make -- <nom>       # Créer une migration
npm --workspace backend run db:seed                       # Seeder les données
npm --workspace backend run build                          # Vérifier la compilation TS

npm --workspace frontend run lint                          # ESLint frontend
```

Liste complète : `.claude/rules/commands.md`.

## Conventions de code à respecter

- **Style Prettier :** pas de point-virgule, guillemets simples, 2 espaces, virgules finales ES5, 120 caractères max, fins de ligne LF.
- **Nommage fichiers :** kebab-case (`auth.controller.ts`).
- **Nommage classes/types :** PascalCase. **Variables/fonctions :** camelCase. **Colonnes DB :** snake_case.
- **TypeScript strict** côté backend, pas de `any` implicite.
- **Backend :** un module par domaine métier (`{module}.module.ts`, `.controller.ts`, `.service.ts`, `dto/`, `schemas/`, `types/`). Les modules simples restent plats, les modules complexes utilisent des sous-dossiers.
- **Frontend :** Server Components par défaut, `'use client'` uniquement pour l'interactivité. Pattern de page : `page.tsx` → `_hooks/` → `_components/` co-localisés dans le dossier de la page.

## Workflow de développement

1. `npm run db:up` avant tout travail backend.
2. Après modification du schéma de base de données : créer une migration Knex, ne jamais modifier une migration déjà appliquée en production.
3. Lancer les tests backend après chaque changement (`npm --workspace backend run test`).
4. Vérifier `npm --workspace backend run build` et `npm --workspace frontend run lint` avant de proposer un commit.
5. Pas de pipeline CI/CD automatisé : les vérifications locales sont la seule barrière avant merge.

## Règles impératives pour les modifications automatisées

- **Toujours protéger les routes** avec `@UseGuards(JwtAuthGuard)`, y compris les endpoints de génération IA. Aucune exception.
- **Ne jamais modifier `app.enableCors()`** sans conserver la restriction à `FRONTEND_URL` avec `credentials: true`.
- **Ne jamais retirer le rate limiting** (`ThrottlerGuard` global ou `@Throttle()` sur les routes sensibles : login, signup, routes IA).
- **Ne jamais désactiver `forbidNonWhitelisted`** dans la validation des DTOs.
- **Ne jamais introduire de fallback pour `JWT_SECRET`** : l'application doit refuser de démarrer si la variable est absente.
- **Ne jamais supprimer les security headers** définis dans `frontend/next.config.ts`.
- **Ne jamais réactiver `turbopack: { root: '../' }`** dans `frontend/next.config.ts` — cause des redémarrages intempestifs du backend en watch mode.
- **Toute interaction OpenAI** doit utiliser `model: 'gpt-4.1'`, `response_format: json_object`, et valider la réponse avec un schéma Zod dédié.
- **Injecter `UserContextService`** (exporté par `WorkoutsModule`) dans tout nouveau service IA nécessitant le contexte utilisateur (1RM, équipements, sessions, compétences actives).
- **Ne pas confondre les deux flux de log de workout** : `LogWorkoutModal` (calendrier, API backend) et `WorkoutResultModal` (timer intégré, `localStorage`) sont deux chemins séparés et non interchangeables.
- **Les migrations Knex** vivent dans `backend/src/database/migrations/`, jamais dans `backend/database/`.
- **Ne pas lancer un backend séparé** en parallèle de `npm run dev` : conflit sur le port 3001.

## Fichiers et répertoires clés

- `backend/src/workouts/user-context.service.ts` — contexte utilisateur partagé pour les services IA.
- `backend/src/workouts/ai-workout-generator.service.ts`, `backend/src/skills/ai-skill-generator.service.ts`, `backend/src/workout-sessions/workout-analysis.service.ts` — les trois services de génération/analyse IA.
- `frontend/services/apiClient.ts` — client HTTP central (gestion JWT automatique).
- `frontend/services/resourceApi.ts` — factory générique pour les clients CRUD.
- `.claude/rules/commands.md` — liste exhaustive des commandes du projet.
- `CLAUDE.md` — contexte détaillé du projet à lire avant toute intervention.
