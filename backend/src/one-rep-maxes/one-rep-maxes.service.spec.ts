import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { OneRepMaxesService } from './one-rep-maxes.service'

describe('OneRepMaxesService.upsert', () => {
  let currentBuilder: Record<string, jest.Mock>
  let historyInsert: jest.Mock
  let invalidateCache: jest.Mock
  let service: OneRepMaxesService

  beforeEach(async () => {
    currentBuilder = {
      insert: jest.fn().mockReturnThis(),
      onConflict: jest.fn().mockReturnThis(),
      merge: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ lift: 'back_squat', value: 150 }]),
    }
    historyInsert = jest.fn().mockResolvedValue([1])
    invalidateCache = jest.fn()

    // trx('table') renvoie le builder de la table visée
    const trx: any = jest.fn((table: string) =>
      table === 'one_rep_maxes' ? currentBuilder : { insert: historyInsert }
    )
    trx.fn = { now: () => 'NOW()' }
    // knex.transaction(cb) : exécute cb(trx) et propage son résultat ou son erreur, comme Knex
    const knexMock: any = { transaction: jest.fn(async (callback: (t: unknown) => unknown) => callback(trx)) }

    const moduleRef = await Test.createTestingModule({
      providers: [
        OneRepMaxesService,
        { provide: getConnectionToken(), useValue: knexMock },
        { provide: UserContextService, useValue: { invalidateCache } },
      ],
    }).compile()
    service = moduleRef.get(OneRepMaxesService)
  })

  it("écrit le 1RM courant et l'historique, puis invalide le cache IA", async () => {
    const result = await service.upsert('user-1', 'back_squat', 150, 'real')

    expect(result).toEqual({ lift: 'back_squat', value: 150 })
    expect(currentBuilder.onConflict).toHaveBeenCalledWith(['user_id', 'lift'])
    expect(historyInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', lift: 'back_squat', value: 150, source: 'real' })
    )
    expect(invalidateCache).toHaveBeenCalledWith('user-1')
  })

  it("propage l'erreur sans invalider le cache si l'écriture de l'historique échoue", async () => {
    historyInsert.mockRejectedValue(new Error('connexion perdue'))

    await expect(service.upsert('user-1', 'back_squat', 150, 'real')).rejects.toThrow('connexion perdue')
    expect(invalidateCache).not.toHaveBeenCalled()
  })
})
