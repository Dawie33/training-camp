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
