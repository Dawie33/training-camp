import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { UserContextService } from 'src/user-context/user-context.service'
import { OneRepMaxesService } from './one-rep-maxes.service'

type Row = Record<string, string | number>

describe('OneRepMaxesService', () => {
  let tables: Record<string, Row[]>
  let service: OneRepMaxesService
  let sequence: number
  let committed: boolean
  let failHistory: boolean
  let failCurrent: boolean
  let invalidateCache: jest.Mock
  let locks: jest.Mock
  let orderings: jest.Mock

  beforeEach(async () => {
    tables = { users: [{ id: 'user-1' }], one_rep_maxes: [], one_rep_max_history: [] }
    sequence = 0
    committed = false
    failHistory = false
    failCurrent = false
    invalidateCache = jest.fn(() => expect(committed).toBe(true))
    locks = jest.fn()
    orderings = jest.fn()

    // Petit stockage en mémoire : exécute les filtres et tris réellement demandés par le service.
    const query = (table: string) => {
      let filter: Row = {}
      let operation = 'read'
      let inserted: Row
      const orders: [string, string][] = []
      const execute = (): Row[] => {
        const rows = tables[table].filter(row => Object.entries(filter).every(([key, value]) => row[key] === value))
        if (operation === 'insert') {
          if (table === 'one_rep_max_history') {
            if (failHistory) throw new Error('history unavailable')
            const row = { ...inserted, id: `history-${++sequence}`, insertion_order: sequence }
            tables[table].push(row)
            return [row]
          }
          if (failCurrent) throw new Error('current unavailable')
          const current = tables[table].find(row => row.user_id === inserted.user_id && row.lift === inserted.lift)
          if (current) Object.assign(current, inserted)
          else tables[table].push(inserted)
          return [current ?? inserted]
        }
        if (operation === 'delete') {
          tables[table] = tables[table].filter(row => !rows.includes(row))
          return rows
        }
        return [...rows].sort((a, b) => {
          for (const [column, direction] of orders) {
            const left = column === 'measured_at' ? Date.parse(String(a[column])) : a[column]
            const right = column === 'measured_at' ? Date.parse(String(b[column])) : b[column]
            if (left !== right) return (left < right ? -1 : 1) * (direction === 'desc' ? -1 : 1)
          }
          return 0
        })
      }
      const builder = {
        where: (value: Row) => {
          filter = value
          return builder
        },
        select: () => builder,
        forUpdate: () => {
          locks(table)
          return builder
        },
        orderBy: (column: string, direction: string) => {
          orders.push([column, direction])
          orderings(table, column, direction)
          return builder
        },
        insert: (row: { user_id: string; lift: string; value: number; source: string; measured_at: string | Date }) => {
          inserted = {
            ...row,
            measured_at: row.measured_at instanceof Date ? row.measured_at.toISOString() : row.measured_at,
          }
          operation = 'insert'
          return builder
        },
        delete: () => {
          operation = 'delete'
          return builder
        },
        onConflict: () => builder,
        merge: () => builder,
        returning: () => builder,
        first: async () => execute()[0],
        then: (resolve: (rows: Row[]) => unknown, reject: (error: unknown) => unknown) =>
          Promise.resolve().then(execute).then(resolve, reject),
      }
      return builder
    }
    const trx = Object.assign(jest.fn(query), { fn: { now: () => '2026-01-15T12:00:00.000Z' } })
    const knex = Object.assign(jest.fn(query), {
      transaction: async (callback: (transaction: typeof trx) => Promise<unknown>) => {
        const snapshot = structuredClone(tables)
        committed = false
        try {
          const result = await callback(trx)
          committed = true
          return result
        } catch (error) {
          tables = snapshot
          throw error
        }
      },
    })
    const moduleRef = await Test.createTestingModule({
      providers: [
        OneRepMaxesService,
        { provide: getConnectionToken(), useValue: knex },
        { provide: UserContextService, useValue: { invalidateCache } },
      ],
    }).compile()
    service = moduleRef.get(OneRepMaxesService)
  })

  it('conserve le courant récent lors de la saisie antidatée, même plus lourde', async () => {
    await service.upsert('user-1', 'back_squat', 150, 'real', '2026-01-10')
    const current = await service.upsert('user-1', 'back_squat', 180, 'estimated', '2025-01-01')
    expect(current).toMatchObject({ value: 150, source: 'real', measured_at: '2026-01-10' })
    const history = await service.findHistoryByUser('user-1')
    expect(history.back_squat.map(row => row.value)).toEqual([180, 150])
    expect(history.back_squat[0].id).toBe('history-2')
    expect(locks).toHaveBeenCalledWith('users')
  })

  it('à instant identique, la dernière saisie prime même moins lourde', async () => {
    await service.upsert('user-1', 'back_squat', 150, 'real', '2026-01-10T12:00:00Z')
    const current = await service.upsert('user-1', 'back_squat', 140, 'estimated', '2026-01-10T13:00:00+01:00')
    expect(current).toMatchObject({ value: 140, source: 'estimated' })
    expect(orderings).toHaveBeenCalledWith('one_rep_max_history', 'insertion_order', 'desc')
    expect((await service.findHistoryByUser('user-1')).back_squat.map(row => row.value)).toEqual([150, 140])
  })

  it('restaure le relevé précédent après suppression, puis retire le courant sans historique', async () => {
    await service.upsert('user-1', 'back_squat', 150, 'real', '2026-01-10')
    await service.upsert('user-1', 'back_squat', 140, 'estimated', '2026-01-10')
    await service.deleteHistory('user-1', 'history-2')
    expect(tables.one_rep_maxes).toEqual([
      expect.objectContaining({ value: 150, source: 'real', measured_at: '2026-01-10' }),
    ])
    await service.deleteHistory('user-1', 'history-1')
    expect(tables.one_rep_maxes).toEqual([])
    expect(await service.findHistoryByUser('user-1')).toEqual({})
    expect(invalidateCache).toHaveBeenCalledTimes(4)
  })

  it('supprime un ancien relevé sans changer le courant ni un autre mouvement', async () => {
    await service.upsert('user-1', 'back_squat', 180, 'real', '2025-01-01')
    await service.upsert('user-1', 'back_squat', 150, 'real', '2026-01-10')
    await service.upsert('user-1', 'deadlift', 200, 'real')
    const before = structuredClone(tables.one_rep_maxes)
    await service.deleteHistory('user-1', 'history-1')
    expect(tables.one_rep_maxes).toEqual(before)
  })

  it('refuse la suppression par un autre propriétaire et un identifiant absent', async () => {
    await service.upsert('user-1', 'back_squat', 150, 'real')
    invalidateCache.mockClear()
    await expect(service.deleteHistory('user-2', 'history-1')).rejects.toMatchObject({ status: 404 })
    await expect(service.deleteHistory('user-1', 'absent')).rejects.toMatchObject({ status: 404 })
    expect(tables.one_rep_max_history).toHaveLength(1)
    expect(tables.one_rep_maxes).toHaveLength(1)
    expect(invalidateCache).not.toHaveBeenCalled()
  })

  it("n'invalide pas le cache et ne modifie pas le courant si la transaction échoue", async () => {
    await service.upsert('user-1', 'back_squat', 150, 'real')
    invalidateCache.mockClear()
    failHistory = true
    await expect(service.upsert('user-1', 'back_squat', 200, 'real')).rejects.toThrow('history unavailable')
    expect(tables.one_rep_maxes[0].value).toBe(150)
    expect(tables.one_rep_max_history).toHaveLength(1)
    expect(invalidateCache).not.toHaveBeenCalled()
  })

  it('projette le jour parisien du relevé horodaté dans la colonne date courante', async () => {
    const current = await service.upsert('user-1', 'back_squat', 150, 'real', '2026-01-10T23:30:00Z')
    expect(current?.measured_at).toBe('2026-01-11')
  })

  it("sans date fournie, utilise l'instant de saisie et supprime un historique unique", async () => {
    const current = await service.upsert('user-1', 'deadlift', 200, 'real')
    expect(current?.measured_at).toBe('2026-01-15')
    expect((await service.findHistoryByUser('user-1')).deadlift[0].measured_at).toBe('2026-01-15T12:00:00.000Z')
    await service.deleteHistory('user-1', 'history-1')
    expect(await service.findAllByUser('user-1')).toEqual([])
  })

  it('annule la suppression si la restauration du courant échoue', async () => {
    await service.upsert('user-1', 'back_squat', 150, 'real', '2026-01-09')
    await service.upsert('user-1', 'back_squat', 140, 'real', '2026-01-10')
    invalidateCache.mockClear()
    failCurrent = true
    await expect(service.deleteHistory('user-1', 'history-2')).rejects.toThrow('current unavailable')
    expect(tables.one_rep_maxes[0].value).toBe(140)
    expect(tables.one_rep_max_history).toHaveLength(2)
    expect(invalidateCache).not.toHaveBeenCalled()
  })
})
