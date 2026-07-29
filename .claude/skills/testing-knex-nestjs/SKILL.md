---
name: testing-knex-nestjs
description: Écrire des tests unitaires Jest pour les services NestJS de CE projet qui utilisent Knex via nest-knexjs. À utiliser quand tu crées ou modifies un *.service.ts injectant `@InjectModel() knex: Knex` et que tu veux le couvrir par des tests unitaires (mock du query builder chaîné, override du provider Knex, structure Arrange-Act-Assert).
---

# Tester un service NestJS + Knex (nest-knexjs)

Ce projet injecte Knex dans les services via `nest-knexjs` :

```ts
import { InjectModel } from 'nest-knexjs'
import { Knex } from 'knex'

@Injectable()
export class ExercisesService {
  constructor(@InjectModel() private readonly knex: Knex) {}
}
```

On ne veut PAS de vraie base de données dans un test unitaire. On mocke donc le
query builder Knex et on l'injecte à la place du vrai via `Test.createTestingModule`.

## 1. Ce qu'il faut savoir sur la stack (déjà en place)

- **Jest est déjà configuré** dans `backend/package.json` (bloc `"jest"`), avec
  `ts-jest`, `rootDir: "src"` et `testRegex: ".*\\.spec\\.ts$"`.
  → Rien à installer, rien à configurer.
- **Imports absolus `src/...`** : les services importent via `src/...` (grâce au
  `baseUrl: "./"` du `tsconfig`). Pour que Jest les résolve, le bloc `"jest"` doit
  contenir un `moduleNameMapper` :
  ```json
  "moduleNameMapper": { "^src/(.*)$": "<rootDir>/$1" }
  ```
  (déjà présent — ne le retire pas, sinon les tests ne démarrent plus).
- **Convention de fichiers** : le test vit **à côté** du service, nommé
  `<service>.spec.ts` (ex. `exercises.service.spec.ts` dans `src/exercises/`).
- **Lancer les tests** : depuis `backend/`, `npm test` (ou `npm run test:watch`).
- **Token d'injection** : `@InjectModel()` (sans argument) résout le token de
  connexion par défaut de `nest-knexjs`. On l'obtient proprement avec
  `getConnectionToken()` importé de `nest-knexjs` (évite de coder en dur la chaîne
  `'default'`).

## 2. Comprendre la chaîne Knex à mocker

Un service typique enchaîne les appels du query builder :

```ts
// requête "liste"
const rows = await this.knex('exercises')
  .select('*')
  .where('name', 'ilike', `%${search}%`)
  .limit(Number(limit))
  .offset(Number(offset))
  .orderBy(orderBy, orderDir)

// requête "count"
const countResult = await this.knex('exercises')
  .count({ count: '*' })
  .where('name', 'ilike', `%${search}%`)
  .first()
```

Deux idées clés :

1. **Chaînable** : `select`, `where`, `count`, `limit`, `offset` renvoient le
   builder lui-même → on peut continuer à chaîner.
2. **Maillon final = valeur résolue** : le builder est *thenable* (on fait `await`
   dessus). Dans la requête liste, le dernier maillon est `orderBy` → il doit
   résoudre le tableau `rows`. Dans la requête count, le dernier maillon est
   `first` → il doit résoudre `{ count }`.

## 3. Le mock Knex chaînable (helper réutilisable)

On crée une factory qui fabrique un builder chaînable. Les méthodes de chaînage
retournent `this` ; les méthodes **terminales** (celles sur lesquelles on fait
`await` : `orderBy`, `first`, `returning`, `delete`) résolvent la valeur voulue.
On passe ces valeurs terminales en paramètre pour couvrir aussi bien les lectures
que les écritures (`insert`/`update`/`delete`).

```ts
function createKnexBuilderMock(terminal: {
  orderBy?: unknown[]        // requête liste : await ...orderBy()
  first?: unknown            // findOne / count : await ...first()
  returning?: unknown[]      // insert/update : await ...returning('*')
  delete?: number            // delete : await ...delete()
} = {}) {
  const builder: any = {
    // chaînage → renvoient le builder
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    // terminales → résolvent une valeur
    orderBy: jest.fn().mockResolvedValue(terminal.orderBy ?? []),
    first: jest.fn().mockResolvedValue(terminal.first),
    returning: jest.fn().mockResolvedValue(terminal.returning ?? []),
    delete: jest.fn().mockResolvedValue(terminal.delete ?? 1),
  }
  return builder
}
```

Comme un service appelle `this.knex('table')` plusieurs fois (une fois pour la
liste, une fois pour le count), on crée un builder distinct à chaque appel et on
en garde une référence pour les assertions :

```ts
const listBuilder = createKnexBuilderMock({ orderBy: rows })
const countBuilder = createKnexBuilderMock({ first: { count: rows.length } })

// knex est une fonction : knex('exercises') -> builder
const knexMock: any = jest
  .fn()
  .mockReturnValueOnce(listBuilder)   // 1er appel = requête liste
  .mockReturnValueOnce(countBuilder)  // 2e appel = requête count
```

Pour une méthode qui n'appelle `this.knex(...)` qu'une seule fois (`findOne`,
`create`, `update`, `delete`), un seul builder suffit :

```ts
// findOne: this.knex('exercises').where({ id }).first()
const builder = createKnexBuilderMock({ first: { id: '1', name: 'Air Squat' } })
const knexMock: any = jest.fn().mockReturnValue(builder)

// create: this.knex('exercises').insert({...}).returning('*')
const builder = createKnexBuilderMock({ returning: [{ id: '1', name: 'Air Squat' }] })
```

> ⚠️ L'ordre des `mockReturnValueOnce` doit suivre l'ordre des appels
> `this.knex(...)` dans le service. Lis le service avant d'écrire le test.

## 4. Injecter le mock via Test.createTestingModule

On construit un module de test NestJS et on fournit le mock **sur le token
`nest-knexjs`** à la place de la vraie connexion :

```ts
import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { ExercisesService } from './exercises.service'

const moduleRef = await Test.createTestingModule({
  providers: [
    ExercisesService,
    { provide: getConnectionToken(), useValue: knexMock },
  ],
}).compile()

const service = moduleRef.get(ExercisesService)
```

`getConnectionToken()` (sans argument) renvoie exactement le token que
`@InjectModel()` réclame → l'injection fonctionne sans base de données.

> Alternative : si le service est déjà déclaré dans un module, tu peux importer ce
> module et faire `.overrideProvider(getConnectionToken()).useValue(knexMock)`.
> Pour un test unitaire pur, fournir directement le service + le mock (comme
> ci-dessus) est plus simple et plus rapide.

## 5. Structure Arrange-Act-Assert (AAA)

Chaque test suit trois temps clairs :

```ts
it('applique un filtre ilike sur le nom quand search est fourni', async () => {
  // Arrange — préparer les données et les mocks
  const rows = [{ id: '1', name: 'Air Squat' }]
  const listBuilder = createKnexBuilderMock({ orderBy: rows })
  const countBuilder = createKnexBuilderMock({ first: { count: 1 } })
  const knexMock: any = jest
    .fn()
    .mockReturnValueOnce(listBuilder)
    .mockReturnValueOnce(countBuilder)
  const service = await buildService(knexMock)

  // Act — exécuter le comportement testé
  const result = await service.findAll({ search: 'squat' })

  // Assert — vérifier le résultat ET les appels au builder
  expect(result).toEqual({ rows, count: 1 })
  expect(listBuilder.where).toHaveBeenCalledWith('name', 'ilike', '%squat%')
})
```

Bonnes pratiques d'assertion :
- Vérifie **le retour** (`result`) ET **les appels au builder**
  (`toHaveBeenCalledWith(...)`) pour prouver que la bonne requête a été construite.
- Pour la pagination, assert sur `limit`/`offset` :
  `expect(listBuilder.limit).toHaveBeenCalledWith(10)`.
- Factorise la construction du service dans un petit helper `buildService(knexMock)`
  qui encapsule le `Test.createTestingModule`.

## 6. Checklist avant de committer

- [ ] Fichier nommé `<service>.spec.ts`, à côté du service.
- [ ] Aucun accès à une vraie base (tout est mocké).
- [ ] Ordre des `mockReturnValueOnce` = ordre des `this.knex(...)` dans le service.
- [ ] `npm test` (dans `backend/`) est vert.
- [ ] Structure AAA respectée, un comportement testé par `it`.
