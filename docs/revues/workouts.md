# Revue du module `workouts`

> Issue #53. Revue faite sur la branche `fix/39-typecheck` (backend reformaté par Prettier) : les numéros de ligne correspondent à ce code.
> Aucune modification de code dans cette revue. Chaque point a été vérifié en lisant le code, et certains en exécutant un petit script (`ValidationPipe`, Knex).

## 1. Rôle du module

`backend/src/workouts/` est le plus gros module du backend (environ 4 600 lignes). Il a quatre responsabilités :

| Responsabilité                                                                   | Fichiers                                                                                                                               | Routes                                                                                         |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| CRUD du **référentiel de workouts** (table `workouts`), benchmarks               | `controllers/workouts.controller.ts`, `services/workouts.service.ts`, `dto/workout.dto.ts`, `common/benchmarks/benchmark-standards.ts` | `GET/POST/PATCH/DELETE /workouts`, `/workouts/benchmark*`, `/workouts/check-monthly-benchmark` |
| **Génération IA** (WOD généré, WOD retrouvé par son nom, WOD extrait d'un texte) | `services/ai-workout-generator.service.ts`, `prompts/crossfit-generator.prompt.ts`, `schemas/workout.schema.ts`                        | `POST /workouts/generate-ai*`, `/parse-text`, `/lookup`, `GET /workouts/suggest-type`          |
| **Planification** au calendrier (table `user_workout_schedule`)                  | `controllers/workout-schedule.controller.ts`, `services/workout-schedule.service.ts`, `dto/schedule.dto.ts`                            | `/workout-schedule/*`                                                                          |
| **Contexte IA** de l'utilisateur, avec un cache                                  | `services/user-context.service.ts`                                                                                                     | aucune (service exporté)                                                                       |

Il reste aussi le circuit « workout personnalisé » (`/workouts/personalized*`, table `personalized_workouts`). Il est abandonné, et sa suppression est déjà prévue par l'issue #48 : cette revue ne le traite pas.

Côté frontend, les appels passent par `frontend/services/workouts.ts` (`workoutsApi`, `workoutsService`) et `frontend/services/schedule.ts` (`scheduleApi`). Les principaux écrans sont :

- `components/workout/WorkoutsCatalogTable.tsx` : la liste et la suppression ;
- `app/(app)/workouts/[id]/` : la création et la modification ;
- `app/(app)/workouts/generate-ai/` et `components/workout/WodCaptureForm.tsx` : la génération IA et la capture d'un WOD ;
- `contexts/AuthContext.tsx` : le benchmark mensuel planifié à la connexion.

## 2. Flux principal

Exemple : l'utilisateur colle la légende Instagram d'un WOD de sa box et le planifie.

1. `WodCaptureForm` appelle `POST /workouts/parse-text`, qui passe par `AIWorkoutGeneratorService.parseWorkoutText()` puis par `OpenAIClientService.createJsonCompletion()` (validation Zod `GeneratedWorkoutSchema`). Le workout n'est **pas encore enregistré**.
2. L'utilisateur relit l'aperçu, puis le frontend appelle `POST /workouts` (`WorkoutsService.create`) avec `isPublic: false` et `status: 'published'`. Une ligne est créée dans `workouts`.
3. Le frontend appelle `POST /workout-schedule` (`WorkoutScheduleService.create`). Le service vérifie qu'aucune séance n'est déjà prévue ce jour-là, insère la ligne dans `user_workout_schedule`, puis tente une synchronisation Google Agenda (une erreur à cette étape est ignorée).
4. Le jour J, le log passe par `/crossfit/log-workout`, puis `PATCH /workout-schedule/:id/complete`. Si le workout est un benchmark, `WorkoutSessionsService` appelle `WorkoutsService.recordBenchmarkResult()`, qui met à jour `users.sport_level` et `benchmark_history`, puis invalide le cache du contexte IA.

La génération personnalisée (`POST /workouts/generate-ai-personalized`) ajoute une étape : `UserContextService.getUserAIContext()` rassemble le profil, les 1RM, les séances récentes, les analyses IA, les compétences actives, les bilans de progression et le diagnostic calculé par `analytics`. Le résultat est gardé en cache mémoire pendant 30 minutes et injecté dans le prompt système.

## 3. Points forts

- **Toutes les routes sont protégées** par `JwtAuthGuard`, y compris les routes IA, et les quatre routes IA ont leur `@Throttle` à 10 par minute (`workouts.controller.ts:186`, `:199`, `:212`, `:227`).
- **Appels IA centralisés** : `callOpenAI()` (`ai-workout-generator.service.ts:287`) passe par `OpenAIClientService`. Il n'y a ni modèle codé en dur, ni `try/catch` qui renverrait `error.message` au client. Le seul `catch` (`:223`) traduit volontairement une réponse invalide en 400 compréhensible.
- **`UNKNOWN_WOD` est géré proprement** par un `z.union` avec un schéma dédié, puis une `BadRequestException` (`:273-282`), comme le demande `CLAUDE.md`.
- **Planification cloisonnée par utilisateur** : chaque requête de `workout-schedule.service.ts` filtre sur `user_id`, et `delete` renvoie 404 quand rien n'a été supprimé.
- **`suggestWeek` n'utilise pas l'IA** : c'est de la logique pure, en UTC, sur trois semaines d'historique.
- **Contexte IA riche et testé** : `user-context.service.spec.ts`, `ai-workout-generator.service.spec.ts` et `crossfit-generator.prompt.spec.ts` existent. Le diagnostic vient d'`analytics`, il n'est jamais recalculé par l'IA.
- **`saveBenchmarkResult` vérifie que le workout est bien un benchmark** avant d'enregistrer (`workouts.service.ts:419-421`).

## 4. Problèmes déjà couverts par une issue ouverte (non repris ici)

| Issue | Sujet dans `workouts`                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| #31   | `@Request() req: { user: { id: string } }` répété dans les deux contrôleurs                                                                       |
| #32   | `UserContextService` à sortir de `WorkoutsModule`                                                                                                 |
| #34   | `process.env` dans le client OpenAI                                                                                                               |
| #35   | `PerformanceDiagnosticSummary` importé par `common/ai/`                                                                                           |
| #36   | `safeJsonStringify` laisse passer une chaîne non-JSON (j'ai confirmé que `CreateWorkoutDto` accepte `blocks: "pas du json"`)                      |
| #40   | Les 10 `toISOString().slice(0, 10)` / `.split('T')[0]` de `workouts.service.ts`, `workout-schedule.service.ts` et `user-context.service.ts`       |
| #41   | L'agenda Google n'est pas mis à jour quand une séance est déplacée (`WorkoutScheduleService.update`)                                              |
| #48   | Le circuit `personalized_workouts` (routes, filtres de durée comparés en texte, `COALESCE` répétés trois fois dans `workout-schedule.service.ts`) |
| #54   | `GET /workouts/check-monthly-benchmark` modifie des données                                                                                       |

## 5. Problèmes classés par gravité

Légende : 🔴 **bloquant** (à corriger avant tout le reste), 🟠 **important**, 🟡 **amélioration**.
Chaque point est classé **bug**, **sécurité** ou **maintenabilité**.

---

### 🔴 S1. Sécurité : n'importe quel utilisateur peut modifier ou supprimer n'importe quel workout, et la suppression efface les séances de tout le monde

**Où** : `workouts.controller.ts:173-176` (`POST`), `:250-253` (`PATCH :id`), `:274-277` (`DELETE :id`), puis `workouts.service.ts:212-252` (`update`) et `:619-622` (`remove`).

**Explication** : ces trois routes demandent seulement d'être connecté. Elles ne vérifient ni que l'utilisateur est l'auteur du workout, ni qu'il a un rôle particulier. La colonne `users.role` (`user` / `admin` / `coach`) existe pourtant (migration `20251008000000_add_role_to_users.ts`), mais aucun garde ne la lit. L'inscription est ouverte, donc n'importe qui peut créer un compte et :

- modifier « Fran » ou tout autre benchmark partagé (nom, blocs, statut, `isPublic`) ;
- **supprimer** un workout. La table `workout_sessions` référence `workouts` avec `onDelete('CASCADE')` (migration `20251007100000_create_workout_sessions_table.ts:8`), comme `benchmark_history` et `user_workout_schedule`. Un seul `DELETE /api/workouts/<id de Fran>` efface donc **les séances loggées, l'historique de benchmark et les planifications de tous les utilisateurs** sur ce WOD.

Le frontend propose d'ailleurs le bouton « Supprimer » à tout le monde (`WorkoutsCatalogTable.tsx:135-145`).

**Piste** :

1. Enregistrer l'auteur côté serveur à la création (voir S3).
2. Dans `update` et `remove`, ajouter `.where({ id, created_by_user_id: userId })`. Pour les workouts partagés (`created_by_user_id` nul : seeds, benchmarks), réserver la modification à un `RolesGuard` « admin ».
3. Renvoyer 404 quand aucune ligne n'est touchée (aujourd'hui `remove` renvoie `{ success: true }` dans tous les cas).
4. Côté frontend, n'afficher « Modifier » et « Supprimer » que pour les workouts dont on est l'auteur.

**Terminé quand** :

- [ ] Un utilisateur B reçoit 404 (ou 403) sur `PATCH` et `DELETE` d'un workout créé par A, ou d'un benchmark partagé
- [ ] Des tests unitaires du service couvrent le cas « pas propriétaire »
- [ ] Le bouton « Supprimer » n'apparaît plus sur les workouts des autres

---

### 🔴 S2. Sécurité : les workouts « privés » des autres utilisateurs sont visibles

**Où** : `workouts.service.ts:42-56` (filtre de `findAll`), `:107-115` (`getBenchmarkWorkouts`), `:84-102` + `workouts.controller.ts:145-153` (`GET :id`).

**Explication** : le filtre de visibilité de `findAll` est un **OU** :

```ts
builder
  .where('isPublic', true)
  .orWhereNull('isPublic')
  .orWhere('workouts.status', 'published')
  .orWhere('created_by_user_id', userId)
```

Il suffit donc qu'un workout soit `published` pour être visible par tous, même avec `isPublic: false`. Or tous les workouts « privés » créés par l'application sont justement `isPublic: false` **et** `status: 'published'` :

- les WOD capturés ou retrouvés (`WodCaptureForm.tsx:94-95`) ;
- les WOD générés puis enregistrés (`useGenerateWorkout.ts`, `isPublic: false`, `status: 'published'`) ;
- la séance du jour du coach (`recommendations/services/daily-session.service.ts:166-182`), dont les `coach_notes` sont rédigées à partir du contexte de l'athlète (blessures, points faibles).

Ces workouts apparaissent donc dans le catalogue de tout le monde. Deux autres routes aggravent le problème :

- `getBenchmarkWorkouts` ne filtre que sur `status = 'published'` et `is_benchmark = true`. Or `WodCaptureForm` en mode « recherche » crée des benchmarks privés (`is_benchmark: mode === 'search'`, `:96`). La recherche « Open 26.1 » d'un utilisateur apparaît donc dans la liste des benchmarks de tous.
- `GET /workouts/:id` ne vérifie **aucune** visibilité : il suffit de connaître l'UUID.

**Piste** : remplacer le OU par une règle explicite, par exemple :

```
(isPublic = true OU isPublic IS NULL) ET status = 'published'
OU created_by_user_id = userId
```

L'appliquer dans `findAll`, `getBenchmarkWorkouts`, `findOne` (passer `userId`) et dans `checkAndScheduleMonthlyBenchmark` (voir B3). Une fonction `applyVisibility(q, userId)` réutilisée partout évite d'oublier un endroit. Cette correction dépend de S3 : tant que `created_by_user_id` est nul, l'auteur ne verrait plus ses propres workouts privés.

**Terminé quand** :

- [x] Un workout `isPublic: false` créé par A n'apparaît ni dans `GET /workouts`, ni dans `GET /workouts/benchmark`, ni dans `GET /workouts/:id` pour B
- [x] A voit toujours ses workouts privés
- [x] Les tests couvrent les trois routes

---

### 🟠 S3. Sécurité et bug : l'auteur d'un workout vient du client, et le frontend ne l'envoie jamais

**Où** : `dto/workout.dto.ts:77` (`created_by_user_id` dans `CreateWorkoutDto`), `workouts.service.ts:376`, `workouts.controller.ts:175` (pas de `req.user`).

**Explication** :

- Le client peut choisir l'auteur. J'ai vérifié avec un script `ValidationPipe` : un `POST /workouts` avec `created_by_user_id` égal à l'UUID d'un autre utilisateur passe la validation.
- À l'inverse, le frontend ne l'envoie jamais : il est absent de `CreateWorkoutDTO` (`frontend/domain/entities/workout.ts:47-63`). Les workouts créés depuis l'interface ont donc `created_by_user_id = null`. Conséquences : la clause `orWhere('created_by_user_id', userId)` de `findAll` ne sert à rien, et le compteur « workouts créés » du profil (`users.service.ts:56`) vaut toujours 0. Seul `DailySessionService` renseigne le champ, parce qu'il appelle le service directement.

**Piste** : retirer `created_by_user_id` des DTO HTTP. Le contrôleur passe `req.user.id` au service, et le service l'écrit. `DailySessionService` continue de le fournir, via un paramètre du service plutôt qu'un champ de DTO.

**Terminé quand** :

- [x] `POST /workouts` avec `created_by_user_id` renvoie 400 (champ inconnu)
- [x] Un workout créé depuis l'interface a `created_by_user_id = <utilisateur connecté>` (test du contrôleur ou du service)

---

### 🟠 B1. Bug : modifier un workout ignore `is_benchmark` (et d'autres champs), et un PATCH sans champ modifiable renvoie 500

**Où** : `workouts.controller.ts:252` (le body est typé `CreateWorkoutDto`), `workouts.service.ts:212-252` (`update` attend `UpdateWorkoutDto` et ne copie que 14 champs).

**Explication** :

- Le contrôleur valide le body avec `CreateWorkoutDto`, qui accepte `is_benchmark`, `slug`, `coach_notes`, `equipment_required`, `scaling_options`, etc. Le service, lui, ne recopie que `name`, `description`, `workout_type`, `difficulty`, `intensity`, `estimated_duration`, `status`, `isActive`, `isFeatured`, `isPublic`, `blocks`, `tags`, `scheduled_date` et `image_url`. Les autres champs sont **ignorés sans erreur**. Le formulaire d'édition (`app/(app)/workouts/[id]/_hooks/useWorkoutForm.ts:174`, case à cocher `WorkoutForm.tsx:77`) envoie `is_benchmark` : cocher « Benchmark » sur un workout existant affiche « Workout mis à jour » mais **ne change rien**.
- Si aucun des 14 champs n'est présent (par exemple un body `{ "is_benchmark": true }`), `updateData` est vide et Knex lève « Empty .update() call detected! » (vérifié par un script). Le client reçoit une 500.
- Si l'id n'existe pas, `update` renvoie `undefined` avec un code 200.

**Piste** : typer le body du contrôleur avec `UpdateWorkoutDto`. Y ajouter les champs réellement modifiables (`is_benchmark`, `coach_notes`, etc.), idéalement avec `PartialType(CreateWorkoutDto)` de `@nestjs/mapped-types`. Recopier tous les champs définis. Renvoyer 400 si rien n'est à modifier et 404 si la ligne n'existe pas.

**Terminé quand** :

- [ ] Cocher « Benchmark » dans l'édition est bien enregistré en base
- [ ] `PATCH` avec un body vide renvoie 400, et `PATCH` d'un id inconnu renvoie 404
- [ ] Un test unitaire couvre `update`

---

### 🟠 B2. Bug : `saveBenchmarkResult` fait confiance au nom envoyé par le client

**Où** : `dto/workout.dto.ts:482-494` (`workoutName` libre), `workouts.service.ts:410-438` puis `:448-512`.

**Explication** : le service charge le workout depuis la base (pour vérifier `is_benchmark`), mais transmet ensuite le `workoutName` **du body** à `recordBenchmarkResult`. Ce nom sert :

- de clé dans `users.benchmark_results` ;
- à choisir le barème dans `BENCHMARK_STANDARDS` (`calculateLevelFromBenchmarks`, `:470`) ;
- de `workout_name` dans `benchmark_history`, sur lequel `getBenchmarkHistory` regroupe les courbes.

Envoyer `workoutId` = Fran avec `workoutName` = « Murph » enregistre donc un résultat de Fran noté avec le barème de Murph, et range la mesure dans la courbe de Murph. Une simple différence de casse (« fran ») suffit à ne trouver aucun barème et à créer une deuxième courbe.

Autre effet, plus discutable : un seul résultat de benchmark **écrase** `users.sport_level` (`:477`), qui sert ensuite de difficulté par défaut à la génération IA.

**Piste** : utiliser `workout.name` lu en base et retirer `workoutName` du DTO (le front l'envoie, il faudra l'enlever de `SaveBenchmarkResultDto` côté `frontend/domain/entities/benchmark`). Écrire `users` et `benchmark_history` dans une même transaction (`knex.transaction`), pour éviter un niveau mis à jour sans historique. Le choix « un seul benchmark fixe le niveau » est à valider avec Dawie, éventuellement dans une issue séparée.

**Terminé quand** :

- [ ] Le nom enregistré dans `benchmark_history` est toujours celui de la base (test)
- [ ] `workoutName` n'est plus accepté par l'API

---

### 🟠 B3. Bug : le benchmark mensuel peut planifier le WOD privé d'un autre utilisateur, et plante sans benchmark

**Où** : `workouts.service.ts:560-612` (`checkAndScheduleMonthlyBenchmark`).

**Explication** :

- `knex('workouts').where({ is_benchmark: true })` (`:565`) prend **tous** les benchmarks de la base, sans filtre de statut ni de visibilité, y compris ceux créés par d'autres utilisateurs via la recherche de WOD (voir S2). Comme un benchmark « jamais testé » est prioritaire, c'est souvent justement le WOD privé d'un autre qui est choisi et planifié automatiquement à la connexion.
- S'il n'y a aucun benchmark, `target` vaut `undefined` et `target.id` (`:601`) lève une `TypeError` (500, avalée par le `.catch(() => {})` du front, donc invisible).
- La boucle de recherche d'un jour libre compte sur la `ConflictException` de `scheduleService.create`. En cas de course (deux onglets ouverts), c'est la contrainte unique `uq_user_date_schedule` qui saute, et l'erreur PostgreSQL brute remonte (voir M2).

**Piste** : réutiliser le filtre de visibilité de S2 (benchmarks partagés publiés, ou benchmarks de l'utilisateur), puis renvoyer `{ scheduled: false }` si la liste est vide. La migration en `POST` (#54) et les dates (#40) restent traitées dans leurs issues.

**Terminé quand** :

- [x] Le benchmark planifié est toujours un benchmark visible par l'utilisateur (test)
- [x] Sans benchmark en base, la route renvoie `{ scheduled: false }` sans erreur

---

### 🟠 B4. Bug : la contrainte unique `workouts.scheduled_date` est commune à tous les utilisateurs

**Où** : migration `20250923132051_create_workouts_table.ts:64` (`table.unique(['scheduled_date'])`), jamais supprimée depuis. Écriture dans `workouts.service.ts:382` et `:244`.

**Explication** : c'est un reste du « WOD du jour » unique de la première version. Dans `workouts`, deux lignes ne peuvent pas avoir la même `scheduled_date`, **quel que soit l'auteur**. Le formulaire d'édition l'envoie (`useWorkoutForm.ts:175`, et `:241` pour la date choisie dans la modale IA). Si A a daté un workout du 3 novembre, B ne peut plus en créer un à cette date, et reçoit une 500 (violation `23505` non traduite). Aujourd'hui, la planification passe par `user_workout_schedule`, et cette colonne n'a plus de rôle clair.

**Piste** : vérifier en production l'usage de la colonne (`SELECT count(*) FROM workouts WHERE scheduled_date IS NOT NULL`). Ensuite, soit la supprimer (migration avec `up` et `down`, plus nettoyage du DTO, du formulaire et du filtre `findAll`), soit au minimum retirer la contrainte unique.

**Terminé quand** :

- [ ] Deux utilisateurs peuvent enregistrer un workout à la même date, ou la colonne n'existe plus
- [ ] La migration a été testée en local (`db:migrate` puis `db:rollback`)

---

### 🟠 S4. Sécurité : textes envoyés à l'IA sans limite de taille

**Où** : `dto/workout.dto.ts:434-451` (`ParseWorkoutTextDto.text`, `LookupWorkoutDto.name`, `LookupWorkoutDto.referenceData`).

**Explication** : ces champs ont un `MinLength` mais **pas de `MaxLength`**, alors que `additionalInstructions` est bien limité à 500 caractères (`:224`, `:255`). Le texte est injecté tel quel dans le prompt (`ai-workout-generator.service.ts:202`, `:248-250`). Avec 10 requêtes par minute autorisées, un utilisateur peut envoyer de très gros textes : coût OpenAI, dépassement de la fenêtre de contexte (502), et plus de place pour une injection de prompt. La taille maximale du body est la seule limite (100 ko par défaut dans Express).

**Piste** : `@MaxLength(5000)` sur `text` et `referenceData`, `@MaxLength(100)` sur `name` (valeurs à ajuster selon les vraies légendes Instagram).

**Terminé quand** :

- [ ] Un texte au-delà de la limite renvoie 400 avant tout appel OpenAI (test du DTO)

---

### 🟡 S5. Sécurité : paramètres non validés qui donnent des 500 (et un lien de séance non contrôlé)

**Où** :

- `workouts.controller.ts:135`, `:147`, `:252`, `:264`, `:276` et `workout-schedule.controller.ts:35-99` : `@Param('id') id: string` sans `ParseUUIDPipe`. Un id qui n'est pas un UUID provoque une erreur PostgreSQL `22P02` (« invalid input syntax for type uuid »), donc une 500. Le module `equipments` a déjà corrigé ce cas (`equipments.controller.ts:22`).
- `workout-schedule.controller.ts:28` : `@Query('weekStart')` sans validation. Sans paramètre, `new Date('undefinedT00:00:00Z').toISOString()` lève une `RangeError` (vérifié), donc une 500. Même chose pour `by-date/:date` (`:46`).
- `workout-schedule.controller.ts:85` : `@Body() body: { session_id?: string }` est un type écrit à la main, que `ValidationPipe` ne peut pas valider. J'ai vérifié avec un script : `{ "session_id": "pas-un-uuid", "extra": 1 }` passe tel quel, malgré `forbidNonWhitelisted`. Une valeur qui n'est pas un UUID donne une 500. Un UUID de séance appartenant à **un autre utilisateur** est accepté et enregistré dans `completed_session_id` (même chose via `PATCH /workout-schedule/:id`, `UpdateScheduleDto.completed_session_id`) : la propriété de la séance n'est jamais vérifiée.

**Piste** : `ParseUUIDPipe` sur tous les `:id`. Un DTO `CompleteScheduleDto { @IsOptional() @IsUUID() session_id }`. `@IsDateString()` sur `weekStart` (via un petit DTO de query) et sur `date`. Dans `WorkoutScheduleService.update`, vérifier que `completed_session_id` appartient bien à `userId`.

**Terminé quand** :

- [ ] Un id qui n'est pas un UUID, un `weekStart` absent ou invalide, ou un `session_id` invalide renvoient 400
- [ ] Lier la séance d'un autre utilisateur renvoie 404

---

### 🟡 B5. Bug : course à la création d'une planification et tri sur une colonne libre

**Où** : `workout-schedule.service.ts:195-215` et `workouts.service.ts:69`.

**Explication** :

- `create` vérifie d'abord qu'il n'existe pas de planification ce jour-là, puis insère. Entre les deux, une autre requête peut insérer la même date : c'est alors la contrainte `uq_user_date_schedule` qui rejette l'insertion, et l'erreur remonte en 500 au lieu de 409. Le helper `isUniqueViolation()` (`common/utils/postgres-errors.ts`) existe déjà et est utilisé par `scheduled-activities`.
- `orderBy` (`WorkoutQueryDto`, `dto/workout.dto.ts:275`) accepte n'importe quelle chaîne. Knex l'échappe correctement (vérifié : `order by "name; drop table x"`), donc **il n'y a pas d'injection SQL**. Mais une colonne inconnue provoque une 500.

**Piste** : entourer l'`insert` d'un `try/catch` qui traduit `isUniqueViolation(error, 'uq_user_date_schedule')` en `ConflictException`. Ajouter `@IsIn([...colonnes triables])` sur `orderBy` (celles du tableau : `name`, `workout_type`, `difficulty`, `intensity`, `status`, `created_at`).

**Terminé quand** :

- [ ] Un doublon de date renvoie toujours 409, même en concurrence (test qui simule l'erreur `23505`)
- [ ] `orderBy=inconnu` renvoie 400

---

### 🟡 M1. Maintenabilité : trois DTO de workout qui divergent, et des champs acceptés puis ignorés

**Où** : `dto/workout.dto.ts` (`CreateWorkoutDto` :21, `UpdateWorkoutDto` :135, `WorkoutDto` :312).

**Explication** : les trois classes répètent les mêmes champs, avec des différences (seul `UpdateWorkoutDto` n'a pas `is_benchmark`, d'où B1). `CreateWorkoutDto` accepte aussi des champs que le client ne devrait jamais fixer et que `create` ignore : `usage_count`, `average_rating`, `total_ratings` (vérifié : `usage_count: 9999` passe la validation). `blocks`, `scaling_options`, `ai_parameters` et `target_metrics` n'ont aucun décorateur de type (`@IsObject()`), d'où le problème de l'issue #36. `WorkoutDto` disparaîtra avec #48.

**Piste** : un seul `CreateWorkoutDto` sans les champs calculés par le serveur, avec `@IsObject()` sur les champs JSON, et `UpdateWorkoutDto = PartialType(CreateWorkoutDto)`.

**Terminé quand** :

- [ ] `UpdateWorkoutDto` dérive de `CreateWorkoutDto`
- [ ] `usage_count`, `average_rating`, `total_ratings` et `created_by_user_id` sont refusés en entrée

---

### 🟡 M2. Maintenabilité : code mort et doublons dans `WorkoutsService`

**Où** : `workouts.service.ts:400-403` (`delete`) et `:619-622` (`remove`).

**Explication** : les deux méthodes sont identiques. Seule `remove` est appelée (`workouts.controller.ts:277`), et `delete` n'a aucun appelant dans le backend. Le constructeur dépend aussi de `WorkoutScheduleService` uniquement pour le benchmark mensuel.

**Piste** : supprimer `delete`. Garder `remove` et y appliquer S1.

**Terminé quand** :

- [ ] Il ne reste qu'une méthode de suppression, couverte par un test

---

### 🟡 M3. Maintenabilité : prompts de `parse-text` et `lookup` écrits dans le service, avec une température élevée

**Où** : `ai-workout-generator.service.ts:194-222` et `:241-270` (prompts inline), `:299` (`temperature: 0.8` pour tous les appels), `:46` (commentaire « GPT-4o » faux).

**Explication** :

- `CLAUDE.md` place les prompts dans `prompts/` : ici, seul le prompt de génération y est. Les deux autres sont dans le service, ce qui empêche de les tester comme `crossfit-generator.prompt.spec.ts`.
- `parse-text` et `lookup` sont des tâches d'**extraction** (« retrouve le WOD **exact** »). Une température de 0.8 augmente la part d'invention, à l'opposé de l'objectif. Une valeur de 0.2 environ conviendrait mieux à ces deux appels, et 0.8 reste adaptée à la génération créative.
- Le modèle est configurable (`OPENAI_MODEL`, `gpt-4.1` par défaut) : le commentaire qui parle de « GPT-4o » est trompeur.

**Piste** : déplacer les deux prompts dans `prompts/` (par exemple `wod-extraction.prompt.ts`, avec un test), passer la température en paramètre de `callOpenAI`, et corriger le commentaire.

**Terminé quand** :

- [ ] Les prompts d'extraction sont dans `prompts/` et testés
- [ ] `parseWorkoutText` et `lookupWorkoutByName` utilisent une température basse (vérifiée par un test sur l'appel à `createJsonCompletion`)

---

### 🟡 M4. Maintenabilité : `UserContextService` construit le diagnostic après les autres requêtes, et le cache ne se vide jamais

**Où** : `user-context.service.ts:180-251` (le `Promise.all`), `:344` (`await this.buildDiagnosticSummary(userId)` après le `Promise.all`), `:136` et `:347` (le cache).

**Explication** :

- Le diagnostic `analytics` (plusieurs requêtes) n'est lancé qu'**après** la fin des sept requêtes parallèles. Il pourrait tourner en même temps qu'elles, ce qui réduirait le temps d'une génération personnalisée sans cache.
- Le cache `Map` ne supprime jamais une entrée expirée : il la remplace seulement au prochain appel du même utilisateur. Il grossit donc d'une entrée par utilisateur actif depuis le démarrage. C'est sans gravité aujourd'hui (peu d'utilisateurs, redémarrages fréquents sur Render), mais à garder en tête.
- Deux requêtes simultanées d'un même utilisateur sans cache construisent chacune le contexte (pas de déduplication de la promesse en cours).
- Un `JSON.parse` sans `try` (`:270`, `:304`, `:313`) suffit, avec une seule ligne corrompue, à faire échouer toute la génération IA.

**Piste** : mettre `buildDiagnosticSummary` dans le `Promise.all`. Supprimer les entrées expirées au moment de la lecture, ou utiliser un cache borné. Optionnellement, mémoriser la promesse en cours par `userId`. À faire au moment de l'extraction prévue par #32.

**Terminé quand** :

- [ ] Le diagnostic est calculé en parallèle des autres requêtes (test existant adapté)
- [ ] Une entrée expirée est supprimée du cache (test)

---

### 🟡 M5. Maintenabilité : pas de tests pour `WorkoutsService` ni `WorkoutScheduleService`

**Où** : seuls `services/ai-workout-generator.service.spec.ts`, `services/user-context.service.spec.ts` et `prompts/crossfit-generator.prompt.spec.ts` existent.

**Explication** : la logique la plus risquée n'a aucun test : droits (S1, S2), `update` (B1), `recordBenchmarkResult` (B2), `checkAndScheduleMonthlyBenchmark` (B3), `suggestWeek` et `create` de la planification (B5). `suggestWeek` et `calculateLevelFromBenchmarks` sont presque des fonctions pures, faciles à tester sans base. Les autres se testent avec le mock Knex décrit dans le skill `testing-knex-nestjs`.

**Piste** : ajouter `workouts.service.spec.ts`, `workout-schedule.service.spec.ts` et `common/benchmarks/benchmark-standards.spec.ts` au fil des corrections ci-dessus, en commençant par les cas d'erreur.

**Terminé quand** :

- [ ] Chaque méthode publique des deux services a au moins un test nominal et un test d'erreur

---

## 6. Propositions d'issues à créer

À créer par Dawie (je ne les ai pas créées). L'ordre conseillé suit la gravité. S1, S2 et S3 se corrigent ensemble.

| #   | Titre proposé                                                                                                  | Points                         | Gravité |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------- |
| 1   | `[Workouts] Réserver la modification et la suppression d'un workout à son auteur (ou à un admin)`              | S1, M2                         | 🔴      |
| 2   | `[Workouts] Corriger le filtre de visibilité : les workouts privés publiés sont visibles par tous`             | S2, B3 (filtre des benchmarks) | 🔴      |
| 3   | `[Workouts] Renseigner created_by_user_id côté serveur au lieu du body`                                        | S3                             | 🟠      |
| 4   | `[Workouts] PATCH /workouts/:id ignore is_benchmark et renvoie 500 sans champ modifiable`                      | B1, M1                         | 🟠      |
| 5   | `[Benchmarks] Utiliser le nom du workout en base dans saveBenchmarkResult`                                     | B2                             | 🟠      |
| 6   | `[Workouts] Benchmark mensuel : ne choisir que des benchmarks visibles, gérer la liste vide`                   | B3                             | 🟠      |
| 7   | `[Workouts] Supprimer la contrainte unique globale sur workouts.scheduled_date`                                | B4                             | 🟠      |
| 8   | `[IA] Limiter la taille des textes envoyés à parse-text et lookup`                                             | S4                             | 🟠      |
| 9   | `[Workouts] Valider les paramètres (UUID, dates, session_id) et vérifier la propriété de completed_session_id` | S5, B5                         | 🟡      |
| 10  | `[IA] Sortir les prompts d'extraction dans prompts/ et baisser leur température`                               | M3                             | 🟡      |
| 11  | `[Architecture] UserContextService : diagnostic en parallèle et cache borné`                                   | M4 (à faire avec #32)          | 🟡      |
| 12  | `[Tests] Couvrir WorkoutsService, WorkoutScheduleService et workout.utils`                                     | M5                             | 🟡      |
