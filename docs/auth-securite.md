# Authentification et sécurité

Ce document décrit comment Training Camp authentifie ses utilisateurs et quelles mesures protègent l'application. Il s'adresse aux Product Owners et aux développeurs qui touchent à l'authentification ou aux API.

## Flux de connexion

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend Next.js
    participant B as Backend NestJS

    U->>F: Saisit email et mot de passe
    F->>B: POST /api/auth/login
    B->>B: Vérifie les identifiants
    B-->>F: Cookie httpOnly "access_token" (7 jours)
    F->>B: Requêtes suivantes (cookie joint automatiquement)
    B->>B: Vérifie le cookie sur chaque route protégée
    B-->>F: Réponse autorisée
```

Après la connexion, le navigateur joint le cookie à chaque requête. Le frontend n'a donc aucun jeton à manipuler.

Le frontend appelle toujours l'API via une réécriture d'URL Next.js (`/api` → backend). Le cookie reste ainsi « même origine ». Les navigateurs mobiles ne le bloquent donc pas.

## Mesures de sécurité en place

| Mesure | Ce qu'elle protège |
|---|---|
| **Authentification obligatoire** | Toutes les routes protégées exigent un jeton valide (`JwtAuthGuard`), y compris les routes IA. |
| **Cookie httpOnly** | Le jeton est inaccessible en JavaScript. Cela limite le vol par faille XSS (injection de script). |
| **CORS restreint** | Seule l'URL du frontend (`FRONTEND_URL`) peut appeler l'API, cookies inclus. CORS : partage de ressources entre origines. |
| **Limitation de débit** | Un nombre maximal de requêtes par minute limite les abus et les coûts d'IA. |
| **Validation stricte** | Tout champ non prévu dans une requête est rejeté (HTTP 400). |
| **En-têtes de sécurité** | Helmet côté API et en-têtes dédiés côté Next.js contrent plusieurs attaques web courantes. |
| **Secret obligatoire** | L'API refuse de démarrer sans clé de signature des jetons (`JWT_SECRET`). |

## Limites de débit par route

| Route | Limite par minute |
|---|---|
| Toutes les routes (par défaut) | 60 |
| Connexion (`POST /auth/login`) | 10 |
| Inscription (`POST /auth/signup`) | 5 |
| Génération de WOD (`POST /workouts/generate-ai`, `/generate-ai-personalized`) | 10 |
| Import d'un WOD (`POST /workouts/parse-text`, `/lookup`) | 10 |
| Génération de programme de compétence (`POST /skills/generate-ai`) | 10 |
| Analyse post-séance (`POST /workout-sessions/:id/analyze`) | 10 |
| Séance du jour (`GET /recommendations/daily-session/check`) | 10 |
| Bilan de progression à la demande (`GET /tracking/report`) | 10 |
| Recommandation du coach — lecture / régénération | 60 / 5 |

> **Exception assumée** : `GET /tracking/report/check-monthly` garde la limite par défaut. Il est appelé à chaque connexion et ne génère qu'un bilan par mois.

> **Détail technique**
>
> `JwtStrategy` lit le jeton d'abord dans le cookie `access_token`. À défaut, il lit l'en-tête `Authorization: Bearer` (appels hors navigateur).
>
> En production, le cookie est posé avec `secure: true` et `sameSite: 'none'`. En local, il utilise `sameSite: 'lax'`.
>
> La validation des DTOs (`class-validator`) est globale, avec `whitelist: true` et `forbidNonWhitelisted: true`.
