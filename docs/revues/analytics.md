# Revue du module analytics

Revue demandée par l'issue #52. Base analysée : branche `docs/52-revue-analytics`, partie de `fix/39-typecheck` (commit `9ed999d`).

Périmètre : `backend/src/analytics/` (contrôleur, service, 8 calculateurs, types), ses deux consommateurs backend (`UserContextService` et `common/ai/diagnostic-prompt.ts`) et ses usages frontend (`services/analytics.ts`, `hooks/usePerformanceOverview.ts`, tableau de bord, onglet Diagnostic de la page Suivi, graphes de `components/charts/`).

Aucune ligne de code n'a été modifiée. Les chiffres cités dans les exemples ont été obtenus en appelant les calculateurs réels avec les données indiquées.

> **Suivi au 2026-10-28** : I1 est corrigé par #73 (fusionnée), I3 et I4 par #74 (fusionnée), I2 par #75 (fusionnée), I6, I7 et A5 par #77 (fusionnée), I5 (lecture) et A6 par #78 (fusionnée), A4 sur la branche `fix/1rm-estimes`. Chaque point porte une ligne **Statut**. Les numéros de ligne cités renvoient au commit analysé (`9ed999d`) et ont bougé depuis.

## 1. Rôle du module

Le module calcule le **diagnostic de performance** d'un athlète, **sans IA** : ratios de force, historique des 1RM, progression par benchmark, filières énergétiques, volume et régularité, charge d'entraînement (sRPE et ACWR), exposition par mouvement et avancement des compétences.

Il a deux clients :

- **L'écran** : `GET /api/analytics/overview?months=3`, affiché sur le tableau de bord et dans l'onglet Diagnostic de `/tracking`.
- **Le coach IA** : `UserContextService.buildDiagnosticSummary()` (`backend/src/workouts/services/user-context.service.ts:361`) résume le diagnostic. `buildDiagnosticPromptLines()` l'injecte ensuite dans les prompts avec la consigne « chiffres mesurés — ne pas les recalculer ni les contredire ».

Conséquence importante pour la suite : **une erreur de calcul ici ne reste pas un chiffre faux à l'écran**. L'IA la reçoit comme une vérité, par exemple « RISQUE ÉLEVÉ — réduire le volume » (`backend/src/common/ai/diagnostic-prompt.ts:18`).

## 2. Flux principal

1. `AnalyticsController.getOverview` (`analytics.controller.ts:20-24`) est protégé par `JwtAuthGuard`. Il borne `months` entre 1 et 12 (3 par défaut).
2. `AnalyticsService.getOverview` (`analytics.service.ts:61`) lance **7 requêtes Knex en parallèle** (`Promise.all`, ligne 67), toutes filtrées par `user_id` :
   - `workout_sessions` terminées depuis la date de début de période (`started_at`, `completed_at`, `results`) ;
   - `one_rep_maxes` (1RM actuels) ;
   - `benchmark_history` et `one_rep_max_history`, **sans borne de période** ;
   - `skill_programs` et `skill_program_steps` actifs ;
   - la dernière séance terminée, avec son analyse IA stockée.
3. Le service prépare les données : conversion des `decimal` en nombres, durée d'effort par séance (`resolveDurationSeconds`, ligne 205), RPE, exercices structurés (`readExerciseResults`, ligne 225).
4. Chaque bloc est confié à une fonction pure de `calculators/`. Le service assemble un objet `PerformanceOverview`.
5. Côté frontend, `usePerformanceOverview(months)` appelle `analyticsService.getOverview()`. Les composants affichent chaque bloc et masquent ceux qui sont `available: false`.

## 3. Points forts

- **Séparation nette requêtes / calculs.** Les calculateurs sont des fonctions pures, sans Knex. On les teste sans mock, et `now` est injectable dans `computeTrainingLoad`. Les 67 tests de `src/analytics` passent (`npx jest --runInBand src/analytics`, 8 suites).
- **Sécurité correcte.** Guard JWT sur le contrôleur, `userId` pris dans le jeton (pas dans l'URL), toutes les requêtes filtrées par `user_id`, y compris la jointure `skill_program_steps` → `skill_programs` (`sp.user_id`). Aucune écriture, aucun appel IA, aucun SQL brut construit avec une entrée utilisateur (le seul `knex.raw` est constant).
- **Pas de faux zéros.** Les blocs sans données renvoient `available: false` ou `null` (ratio sans 1RM, ACWR avant 28 jours, répartition des filières seulement à partir de 8 séances). L'écran affiche alors une invitation, pas un zéro trompeur.
- **Index en place.** `idx_sessions_user_started (user_id, started_at)`, `idx_benchmark_history_user_workout`, `idx_one_rm_history_user_lift` et `uq_one_rm_user_lift` couvrent les requêtes. La performance est correcte à l'échelle actuelle (voir A10).
- **Documentation et commentaires** qui expliquent le _pourquoi_ métier (fenêtre chronique, seuils, règle des benchmarks). Voir aussi `docs/diagnostic-performance.md`.

## 4. Problèmes classés par gravité

### Bloquant

**Aucun.** Pas de faille de sécurité, pas de fuite de données entre utilisateurs, pas d'écriture en base. Les problèmes ci-dessous faussent des chiffres, mais n'empêchent pas l'application de fonctionner.

### Important

#### I1. La charge sRPE utilise la durée du metcon, pas la durée de la séance

- **Où** : `calculators/training-load.ts:48-52` (avec `DEFAULT_SESSION_MINUTES` ligne 19), `analytics.service.ts:132-136` et `205-216`. Origine de la donnée : `frontend/app/(app)/crossfit/log-workout/page.tsx:409-413`, `446` et `505`.
- **Explication** : la méthode de Foster définit sRPE = RPE × **durée totale de la séance**. Ici, la durée vient de `elapsed_time_seconds` (le chrono du WOD), ou de `completed_at - started_at`. Or la page de log calcule `started_at = completed_at - durée du WOD` (chrono, durée de l'AMRAP ou time cap). Une séance de force sans metcon a donc une durée nulle, et le calcul retient 60 min par défaut. Exemple réel :
  - Fran en 4 min à RPE 9 : 9 × 4 = **36 UA** ;
  - séance de force sans chrono à RPE 6 : 6 × 60 = **360 UA**.

  La séance la plus dure pèse dix fois moins. Les charges hebdomadaires, l'ACWR et sa zone sont faussés dans les deux sens.

- **Piste** : séparer les deux notions. La _durée d'effort_ (chrono du WOD) sert aux filières énergétiques. La _durée de séance_ sert au sRPE : la saisir sur la page de log (champ « durée de la séance », prérempli à 60 min), la stocker dans `results.session_duration_minutes` (à ajouter à `SessionResultsSchema`), et la passer à `computeTrainingLoad` à la place de `duration_seconds`.
- **Terminé quand** : `computeTrainingLoad` reçoit une durée de séance distincte de la durée d'effort ; un test montre qu'un Fran de 4 min dans une séance de 60 min à RPE 9 vaut 540 UA ; `docs/diagnostic-performance.md` est à jour.
- **Statut** : ✅ corrigé par #73. Champ `session_duration_minutes` saisi sur la page de log (prérempli : durée du .fit, sinon `estimated_duration` du workout, sinon 60 min) et fonction `resolveSessionMinutes`, qui n'utilise jamais le chrono du WOD. Écart avec le critère : le test porte sur une séance de 70 min avec un metcon de 12 min, pas sur le cas Fran à 540 UA. `docs/diagnostic-performance.md` est mis à jour dans #74.

#### I2. L'ACWR peut annoncer « risque élevé » avec un seul point d'historique ancien

- **Où** : `calculators/training-load.ts:95-99`.
- **Explication** : le garde-fou vérifie seulement que la séance avec RPE **la plus ancienne** date d'au moins 28 jours. Il ne vérifie pas que la fenêtre chronique est remplie. Exemple réel : une séance à RPE 5 le 3 août, puis une le 21 septembre (calcul le 23). Résultat : `acute = 300`, `chronic = 75`, **`acwr = 4`, zone `high_risk`**. Cela arrive dès qu'un athlète a saisi un RPE une fois, puis s'y remet régulièrement. Avec un ACWR « couplé » (la semaine aiguë est incluse dans les 28 jours), 4,0 est le maximum mathématique : toute la charge est dans les 7 derniers jours. Le coach IA reçoit alors « RISQUE ÉLEVÉ — réduire le volume ».
- **Piste** : exiger des données dans la fenêtre chronique elle-même, par exemple au moins une séance avec RPE dans 3 des 4 semaines des 28 derniers jours. Sinon `acwr = null`.
- **Terminé quand** : le cas ci-dessus renvoie `acwr: null` ; un test couvre « un point ancien isolé + reprise » ; le test existant « charge stable → zone optimale » passe toujours.
- **Statut** : ✅ corrigé par #75. En plus de l'ancienneté, l'ACWR exige une séance avec RPE dans 3 des 4 tranches de 7 jours et un RPE sur 75 % des séances de la fenêtre. La zone `high_risk` est renommée « hausse rapide de charge — stabiliser, ne plus augmenter » (prompt) et « Hausse rapide » (écrans). La formule (ACWR couplé, moyennes glissantes) est inchangée.

#### I3. « Variation vs semaine passée » compare des semaines qui ne se suivent pas

- **Où** : `calculators/training-load.ts:101-106` (et `calculators/training-volume.ts`, même construction de `weeks`).
- **Explication** : `weeks` ne contient que les semaines **qui ont des séances**. `weeks[length - 2]` n'est donc pas forcément la semaine précédente. Dans l'exemple de I2, la variation compare la semaine du 21 septembre à celle du 3 août et affiche **0 %**, alors que 6 semaines sans séance les séparent. De plus, la dernière semaine est souvent la semaine en cours, incomplète : le lundi, la variation est presque toujours très négative. Cette valeur est envoyée au coach IA (« variation −80 % vs semaine passée », `diagnostic-prompt.ts:65-71`).
- **Piste** : construire une suite de semaines continue (semaines vides à 0) entre le début de la période et aujourd'hui. Comparer la **dernière semaine complète** à celle d'avant.
- **Terminé quand** : la variation vaut `null` ou −100 % quand la semaine précédente est vide, selon le choix documenté ; elle ne compare jamais une semaine partielle ; tests avec `now` injecté.
- **Statut** : ✅ corrigé par #74. Comparaison de la dernière semaine complète à la précédente. Choix documenté : la variation vaut −100 % si la dernière semaine complète est vide, et `null` si c'est la semaine de référence qui l'est.

#### I4. Volume et régularité mal mesurés

- **Où** : `calculators/training-volume.ts:45` et `60-61`. Tests trop permissifs : `calculators/training-volume.spec.ts:28-40`.
- **Explication** : `week_span = ceil((dernière séance − première séance) / 7 jours)`. Ce calcul a deux défauts :
  - **Erreur d'une semaine** : 4 séances le mardi de 4 semaines consécutives donnent `week_span = 3`, `avg_per_week = 1.3` au lieu de 1, et une régularité de 133 %, masquée par le `Math.min(100, …)`. Avec une séance le dimanche et une le lundi suivant, `week_span = 1` pour 2 semaines calendaires.
  - **La période n'est pas prise en compte** : la durée est mesurée entre la première et la dernière séance, pas sur la période demandée ni jusqu'à aujourd'hui. Une seule séance il y a 3 mois donne **100 % de régularité**. Un athlète arrêté depuis 6 semaines garde 100 %.

  Les tests vérifient seulement `< 100` ou `<= 100`, ce qui laisse passer ces erreurs. Enfin, les semaines vides ne figurent pas dans `weeks` : le graphe `WeeklyVolumeChart` (`frontend/components/charts/WeeklyVolumeChart.tsx:17`) affiche les barres côte à côte, sans montrer les trous.

- **Piste** : passer la date de début de période et `now` au calculateur. Compter les semaines calendaires (lundi → dimanche) de la période. Remplir les semaines vides à 0 (même suite que I3). Écrire des tests avec des valeurs exactes.
- **Terminé quand** : 4 séances sur 4 semaines consécutives donnent `week_span = 4`, `avg_per_week = 1`, `consistency_pct = 100` ; une seule séance sur une période de 3 mois donne une régularité d'environ 8 % ; le graphe montre les semaines à zéro.
- **Statut** : ✅ corrigé par #74. Fenêtre du début de période (ou de la première séance, si elle est plus récente) jusqu'à la semaine en cours, comptée seulement si elle est entamée ; semaines vides à 0 dans `weeks` ; tests à valeurs exactes. Une seule séance il y a 3 mois donne 1/13 ≈ 8 %.

#### I5. La règle « un benchmark ne se compare qu'à lui-même » n'est pas garantie

- **Où** : `calculators/benchmark-progress.ts:54` (regroupement), `64` (type de score), `79-82` (variation). Origine des données : `workouts/services/workouts.service.ts:411` et `499`, `workout-sessions/workout-sessions.service.ts:107` et `149`.
- **Explication** : trois failles, vérifiées avec le calculateur réel :
  - **Regroupement par nom, pas par workout.** `benchmark_history` possède une colonne `workout_id`, mais le calcul regroupe par `workout_name`. Par le formulaire `POST /workouts/benchmark-result`, ce nom vient **du client** (`SaveBenchmarkResultDto.workoutName`) et n'est pas relu en base. Deux workouts de même nom sont donc fusionnés, et un même workout peut être coupé en deux séries (« Fran » et « fran »).
  - **Type de score non vérifié.** Le type est lu sur le premier point seulement. Si un point a un autre type, la variation mélange des secondes et des rounds. Exemple réel : Fran en 300 s, puis un score « 2 rounds » → **+99,3 %, `improving`**. Le formulaire accepte n'importe quel type pour n'importe quel benchmark.
  - **Reps supplémentaires ignorées.** Pour un AMRAP, seuls les rounds comptent. Cindy « 15 rounds + 2 », puis « 15 rounds + 14 » → **0 %, `stable`**, alors que l'athlète a fait 12 reps de plus. `calculateLevelFromBenchmarks` en tient pourtant compte (`rounds + reps / 100`).

  Côté écriture, deux autres défauts touchent les données lues ici. `recordBenchmarkIfApplicable` réinsère un point **à chaque mise à jour** d'une séance avec résultats. Et `measured_at` vaut la date d'insertion, pas la date de la séance : un WOD saisi après coup est daté du jour de saisie.

- **Piste** :
  - côté analytics : regrouper par `workout_id` (le sélectionner dans la requête, garder `workout_name` pour l'affichage) ; ne comparer que les points du type majoritaire, ou du type attendu par `BENCHMARK_STANDARDS[nom].metric` ; pour `rounds`, comparer un total de reps (rounds × reps par round + reps supplémentaires) ou, à défaut, `rounds + extra_reps / 100` comme `calculateLevelFromBenchmarks` ;
  - côté écriture (à traiter dans les revues #53 et #51) : relire le nom en base au lieu de `workoutName`, dater le point avec `completed_at`, et ne pas créer de doublon lors d'une modification.
- **Terminé quand** : deux workouts homonymes donnent deux séries ; un point d'un autre type est exclu de la variation ; le cas Cindy ci-dessus donne une tendance positive ; tests pour chacun des trois cas.
- **Statut** : ✅ partie lecture corrigée par #78. Séries regroupées par `workout_id` (nom le plus récent affiché) ; type de référence = celui du barème, sinon le majoritaire, les autres points sont exclus ; reps d'AMRAP comptées en fraction de round (`repsPerRound: 30` pour Cindy, 100 par défaut comme `calculateLevelFromBenchmarks`). Écart avec le critère : le cas Cindy donne **+2,7 %, `stable`** et non une tendance positive. 12 reps sur ~450 restent sous le seuil de bruit de 3 %, qui est conservé ; un test montre qu'un gain plus net passe en `improving`. La partie écriture reste dans #51 et #53.

#### I6. Exposition par mouvement : force et metcon mélangés

- **Où** : `calculators/movement-exposure.ts:63-66` et `78`, `analytics.service.ts:225-243` (`section_type` n'est pas transmis).
- **Explication** : `exercise_results` contient une entrée **par exercice et par section**. C'est le contrat validé par `session-results.schema.spec.ts:60-61` : un Thruster en `strength` à 70 kg et un Thruster en `metcon` à 42,5 kg dans la même séance. Le calculateur compte alors **2 expositions** pour une seule séance. Il fait aussi la moyenne des deux charges : 56,3 kg, soit « 70 % du 1RM » si le 1RM vaut 80 kg. Ce chiffre ne correspond à aucun travail réel. Le taux de scaling (`most_scaled`, envoyé à l'IA) est faussé de la même façon.
- **Piste** : transmettre `section_type` dans `LoggedExercise` et le numéro de séance. Compter une exposition par séance et par mouvement. Calculer `avg_load_kg` et `pct_of_1rm` à partir des sections `strength` uniquement, ou afficher les deux séparément.
- **Terminé quand** : le cas Thruster force + metcon donne 1 exposition et un % du 1RM calculé sur 70 kg ; un test le prouve.
- **Statut** : ✅ corrigé par #77. Une exposition par séance (`session_index`), séance scalée si une section l'est. Charges et % du 1RM calculés sur la force si le mouvement y figure, sinon sur le metcon, jamais mélangés ; nouveau champ `load_source` affiché à l'écran. Échauffement, accessoires et skill exclus des charges.

#### I7. Le service n'a aucun test

- **Où** : `backend/src/analytics/analytics.service.ts` (pas de `analytics.service.spec.ts`).
- **Explication** : seuls les calculateurs sont testés. `resolveDurationSeconds` (chrono prioritaire, plafond de 4 h), `readExerciseResults` (filtrage de l'ancien format), `readAnalysis` (analyse partielle → `null`) et la conversion des `decimal` Knex n'ont aucun test. Or les corrections I1 et I6 passent par ces méthodes.
- **Piste** : écrire `analytics.service.spec.ts` avec le skill `testing-knex-nestjs` (mock du query builder chaîné), avant de corriger I1 et I6.
- **Terminé quand** : le spec couvre les trois méthodes privées via `getOverview` et vérifie que chaque requête filtre par `user_id`.
- **Statut** : ✅ corrigé par #77. `analytics.service.spec.ts` : filtre `user_id` vérifié sur les 8 requêtes (un builder par appel), durée d'effort, conversion des `decimal`, filtrage des exercices, relecture de l'analyse.

### Amélioration

#### A1. Paramètre `months` validé à la main

- **Où** : `analytics.controller.ts:21-22`.
- **Explication** : `?months=1.5` est accepté. La réponse annonce `period_months: 1.5`, mais `setMonth` (`analytics.service.ts:63`) tronque le résultat : sur un mois de septembre, `9 − 1,5 = 7,5` devient 7, donc la requête remonte **2 mois**. Le reste de l'API utilise des DTO `class-validator`.
- **Piste** : `OverviewQueryDto` avec `@Type(() => Number) @IsInt() @Min(1) @Max(12) @IsOptional()`. Pour `@Req()`, voir #31.
- **Terminé quand** : `months=1.5` ou `months=20` renvoie 400 ; test e2e ou unitaire du DTO.

#### A2. Semaines calculées à l'heure du serveur

- **Où** : `calculators/training-volume.ts:15-17` (`getDay`, `setHours`), utilisé aussi par `training-load.ts`.
- **Explication** : `weekStart` utilise le fuseau du processus Node, probablement UTC sur Render. Une séance le lundi à 0 h 30 à Paris (dimanche 22 h 30 UTC) tombe dans la semaine précédente. C'est le même type de problème que #40, mais une autre fonction.
- **Piste** : calculer la semaine dans le fuseau de l'athlète (`Europe/Paris` par défaut, ou un fuseau de profil), avec une fonction partagée par les calculateurs.
- **Terminé quand** : un test avec `TZ=UTC` place une séance du lundi 0 h 30 heure de Paris dans la bonne semaine.

#### A3. ACWR : nuancer le message

- **Où** : `calculators/training-load.ts:22-27` et `90`, `common/ai/diagnostic-prompt.ts:18`.
- **Explication** : l'ACWR calculé est la version « couplée » (la semaine aiguë fait partie des 28 jours) en moyennes glissantes. La littérature récente discute la validité de ce modèle et de ses seuils comme prédicteurs de blessure. Les seuils sont corrects pour la méthode choisie, mais « RISQUE ÉLEVÉ — réduire le volume » est une consigne forte pour l'IA.
- **Piste** : formuler l'alerte comme un signal (« hausse rapide de charge ») plutôt qu'un risque. Éventuellement, passer en version découplée ou en moyennes exponentielles (EWMA), à valider avec le skill `coach-crossfit`.
- **Terminé quand** : choix documenté dans `docs/diagnostic-performance.md`, libellés frontend et prompt alignés.
- **Statut** : 🟡 en partie traité par #75. Libellés alignés (« hausse rapide de charge — stabiliser, ne plus augmenter » dans le prompt, « Hausse rapide » à l'écran) et choix documenté. La version découplée ou EWMA n'est pas retenue pour l'instant.

#### A4. 1RM estimés et réels mélangés

- **Où** : `analytics.service.ts:75` et `84-87`.
- **Explication** : la colonne `source` (`real` / `estimated`) n'est pas lue. Un 1RM estimé peut produire un « gain » dans l'historique, ou fausser un ratio de force. Voir aussi #45 (contrainte sur `source`) et #43 (corriger un 1RM erroné).
- **Piste** : sélectionner `source`, marquer les points estimés dans `computeStrengthHistory` (et dans le graphe), et signaler un ratio calculé sur une estimation.
- **Terminé quand** : la réponse indique, pour chaque point et chaque ratio, s'il repose sur une estimation.
- **Statut** : ✅ corrigé sur la branche `fix/1rm-estimes`. Chaque point d'historique porte `estimated`, chaque ratio `based_on_estimate`. Le gain et la tendance ne comparent que des relevés de même nature que le 1RM actuel. Le coach IA reçoit « (1RM estimé — à confirmer par un test) » sur un déséquilibre concerné, et l'écran affiche la mention « estimé ». Reste ouvert : le % du 1RM de l'exposition par mouvement peut reposer sur un 1RM estimé sans le signaler.

#### A5. Correspondance mouvement → 1RM fragile

- **Où** : `calculators/movement-exposure.ts:21-28` (`toLiftKey`).
- **Explication** : « Clean & Jerk » devient `clean_jerk`, pas `clean_and_jerk`, donc `pct_of_1rm` est toujours `null` pour ce mouvement. Il en va de même pour les noms en français (« Épaulé-jeté ») et les variantes (« Squat Clean »).
- **Piste** : une table d'alias explicite (`clean & jerk`, `c&j`, `épaulé-jeté` → `clean_and_jerk`), partagée avec `ONE_REP_MAX_LIFTS`.
- **Terminé quand** : test sur « Clean & Jerk » et « Épaulé-jeté ».
- **Statut** : ✅ corrigé par #77. `calculators/lift-aliases.ts`, typée sur `ONE_REP_MAX_LIFTS` ; Power Clean et Power Snatch volontairement non reliés.

#### A6. Benchmarks : barème Cindy et sens des courbes

- **Où** : `calculators/benchmark-progress.ts:34-35`, `frontend/app/(app)/dashboard/components/bento/PerformanceCards.tsx:208-210`.
- **Explication** : le commentaire dit que le seuil « beginner » est une borne ouverte (999999). C'est vrai pour les WOD au temps, mais pas pour Cindy (`beginner: 8`), dont la bande est donc retirée sans raison. Côté tableau de bord, la mini-courbe d'un benchmark au temps **monte quand l'athlète régresse**, puisqu'elle trace `score_value` brut sans tenir compte de `lower_is_better`.
- **Piste** : ne retirer le seuil que s'il vaut 999999 ; inverser l'axe (ou tracer `−score`) quand `lower_is_better` est vrai.
- **Terminé quand** : Cindy affiche 4 bandes, et la courbe de Fran monte quand le temps baisse.
- **Statut** : ✅ corrigé par #78. Seule la borne 999999 est retirée ; la mini-courbe du tableau de bord inverse son axe quand `lower_is_better` est vrai et trace `comparable_value`. Son infobulle affiche aussi le score de chaque point (elle répétait le dernier).

#### A7. Dépendance analytics → workouts

- **Où** : `calculators/benchmark-progress.ts:1` importe `BENCHMARK_STANDARDS` de `workouts/workout.utils`, alors que `WorkoutsModule` importe `AnalyticsModule` (`workouts/workouts.module.ts:17`).
- **Explication** : la dépendance va dans les deux sens au niveau des fichiers. Ce n'est pas un cycle de modules Nest, mais une constante métier rangée dans le mauvais module. Même famille que #35 et #32.
- **Piste** : déplacer `BENCHMARK_STANDARDS` (et `calculateLevelFromBenchmarks`) dans `common/benchmarks/`. À faire avec #32.
- **Terminé quand** : `analytics/` n'importe plus rien de `workouts/` ; `src/app.module.spec.ts` passe.

#### A8. Frontend : types copiés à la main et requêtes concurrentes

- **Où** : `frontend/services/analytics.ts:1-175` (copie de `types/analytics.types.ts`), `frontend/hooks/usePerformanceOverview.ts:20-30`.
- **Explication** : les types sont dupliqués sans contrôle, et toute évolution (I1, I4, A4) doit être faite deux fois. Par ailleurs, si l'utilisateur change vite de période, une réponse plus lente pour l'ancienne période peut arriver en dernier et écraser la bonne.
- **Piste** : ignorer les réponses obsolètes (drapeau `cancelled` dans l'effet, ou `AbortController`). Pour les types, un commentaire « à synchroniser avec … » au minimum.
- **Terminé quand** : changer de période deux fois de suite affiche toujours la dernière période demandée.

#### A9. La période ne s'applique pas à tous les blocs

- **Où** : `analytics.service.ts:77-87`, `docs/diagnostic-performance.md` (section « Comment ça fonctionne »).
- **Explication** : les benchmarks et l'historique des 1RM ne sont pas bornés par `months`. C'est un choix voulu pour les 1RM (commentaire ligne 82), mais il n'est pas commenté pour les benchmarks. La documentation dit au contraire que « le service lit les données de l'athlète sur la période choisie ». Changer la période ne modifie donc pas ces blocs, sans que l'écran le dise.
- **Piste** : documenter le choix dans le code et dans la doc, et l'indiquer à l'écran (« tout l'historique »).
- **Terminé quand** : doc, commentaire et libellé à l'écran sont cohérents.

#### A10. Performance des agrégations

- **Où** : `analytics.service.ts:67-115`, `backend/knexfile.ts` (`pool.max: 10`).
- **Explication** : les requêtes sont indexées, et les volumes restent faibles (au plus 12 mois de séances d'un seul athlète). Il n'y a pas de problème aujourd'hui. Deux points à surveiller :
  - chaque appel prend jusqu'à **7 connexions** du pool à la fois. Le tableau de bord, la page Suivi et `UserContextService` (cache de 30 min) appellent `getOverview`, donc deux requêtes simultanées occupent 14 connexions demandées pour 10 disponibles (les autres attendent) ;
  - `results` (jsonb) est chargé en entier, y compris les données Coros, alors que seuls `rpe`, `elapsed_time_seconds` et `exercise_results` servent.
- **Piste** : ne sélectionner que les clés utiles (`results->'rpe'`, etc.) ; regrouper les deux requêtes de compétences en une seule. Ajouter un cache seulement si la mesure le justifie.
- **Terminé quand** : mesure avant/après sur un compte avec 12 mois de données (`EXPLAIN ANALYZE`), décision notée dans la revue.

#### A11. `performance_level` relu sans vérification

- **Où** : `analytics.service.ts:187-191`.
- **Explication** : la valeur est seulement testée comme `string`, puis convertie en `PerformanceLevel`. Une ancienne analyse avec une autre valeur passe telle quelle au frontend.
- **Piste** : vérifier la valeur contre la liste des niveaux (ou un `z.enum`), sinon renvoyer `null`.
- **Terminé quand** : test avec `performance_level: 'excellent'` → `analysis: null`.

## 5. Issues existantes concernées

| Issue | Lien avec cette revue                                                                      |
| ----- | ------------------------------------------------------------------------------------------ |
| #31   | `@Req() req: AuthenticatedRequest` dans `analytics.controller.ts` → `@CurrentUser()` (A1)  |
| #32   | Sortir le code partagé de `WorkoutsModule` : même démarche pour `BENCHMARK_STANDARDS` (A7) |
| #35   | Même famille de dépendance entre modules (A7)                                              |
| #40   | Dates et fuseaux : même famille que `weekStart` (A2), mais une autre fonction              |
| #43   | Un 1RM erroné fausse les ratios et l'historique (A4)                                       |
| #45   | `source` sans contrainte : prérequis pour A4                                               |
| #48   | La jointure `personalized_workouts` de la dernière séance disparaîtra avec ce nettoyage    |
| #51   | Écriture de `benchmark_history` à chaque mise à jour de séance, `measured_at` (I5)         |
| #53   | `workoutName` venu du client dans `SaveBenchmarkResultDto` (I5)                            |

## 6. Propositions d'issues (non créées)

1. ~~**[Analytics] sRPE : utiliser la durée de la séance, pas le chrono du WOD** (I1). Ajouter une durée de séance saisie sur la page de log, et la séparer de la durée d'effort utilisée pour les filières.~~ Fait dans #73.
2. ~~**[Analytics] ACWR : exiger un historique chronique réel avant de conclure** (I2). Remplacer le test « séance la plus ancienne ≥ 28 jours » par une couverture minimale des 4 semaines.~~ Fait dans #75 (ancienneté conservée, couverture ajoutée).
3. ~~**[Analytics] Semaines continues : variation hebdomadaire et régularité justes** (I3 + I4). Suite de semaines sans trou sur la période, variation sur la dernière semaine complète, `week_span` calendaire, tests à valeurs exactes.~~ Fait dans #74.
4. ~~**[Analytics] Benchmarks : regrouper par workout_id, contrôler le type de score, compter les reps d'AMRAP** (I5, partie lecture). La partie écriture reste dans #51 et #53.~~ Fait dans #78.
5. ~~**[Analytics] Exposition par mouvement : une exposition par séance, charges de force séparées** (I6, avec la table d'alias de A5).~~ Fait dans #77.
6. ~~**[Analytics] Tests unitaires du service** (I7). Prérequis de l'issue 5. L'issue 1 s'en est passée : la logique a été extraite dans une fonction pure testée (`resolveSessionMinutes`).~~ Fait dans #77.
7. **[Analytics] Valider `months` avec un DTO** (A1).
8. **[Analytics] Semaines calculées dans le fuseau de l'athlète** (A2).
9. ~~**[Analytics] Distinguer les 1RM estimés dans l'historique et les ratios** (A4, après #45).~~ Fait sur `fix/1rm-estimes`.
10. ~~**[Analytics] Benchmarks à l'écran : barème Cindy et courbes au temps inversées** (A6).~~ Fait dans #78.
11. **[Analytics] Frontend : ignorer les réponses obsolètes du diagnostic** (A8).
12. **[Analytics] Documenter les blocs non bornés par la période** (A9, avec la nuance du message ACWR de A3).
