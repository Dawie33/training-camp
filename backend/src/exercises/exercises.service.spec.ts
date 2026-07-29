import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { ExercisesService } from './exercises.service'

/**
 * Fabrique un mock chaînable du query builder Knex.
 * Les méthodes de chaînage renvoient le builder ; les méthodes terminales
 * (celles sur lesquelles le service fait `await`) résolvent la valeur passée.
 */
function createKnexBuilderMock(terminal: {
    orderBy?: unknown[] // requête liste : await ...orderBy()
    first?: unknown // findOne / findByName / count : await ...first()
    returning?: unknown[] // insert/update : await ...returning('*')
    delete?: number // delete : await ...delete()
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

/**
 * Construit le ExercisesService avec un mock Knex injecté à la place de la
 * vraie connexion (token nest-knexjs), sans base de données.
 */
async function buildService(knexMock: any) {
    const moduleRef = await Test.createTestingModule({
        providers: [
            ExercisesService,
            { provide: getConnectionToken(), useValue: knexMock },
        ],
    }).compile()

    return moduleRef.get(ExercisesService)
}

describe('ExercisesService.findAll', () => {
    it('sans filtre → renvoie { rows, count }', async () => {
        // Arrange
        const rows = [
            { id: '1', name: 'Air Squat' },
            { id: '2', name: 'Pull Up' },
        ]
        const listBuilder = createKnexBuilderMock({ orderBy: rows })
        const countBuilder = createKnexBuilderMock({ first: { count: 2 } })
        const knexMock: any = jest
            .fn()
            .mockReturnValueOnce(listBuilder)
            .mockReturnValueOnce(countBuilder)
        const service = await buildService(knexMock)

        // Act
        const result = await service.findAll({})

        // Assert
        expect(result).toEqual({ rows, count: 2 })
        expect(knexMock).toHaveBeenCalledWith('exercises')
        expect(listBuilder.where).not.toHaveBeenCalled()
    })

    it('avec search → applique un where ilike sur name', async () => {
        // Arrange
        const rows = [{ id: '1', name: 'Air Squat' }]
        const listBuilder = createKnexBuilderMock({ orderBy: rows })
        const countBuilder = createKnexBuilderMock({ first: { count: 1 } })
        const knexMock: any = jest
            .fn()
            .mockReturnValueOnce(listBuilder)
            .mockReturnValueOnce(countBuilder)
        const service = await buildService(knexMock)

        // Act
        const result = await service.findAll({ search: 'squat' })

        // Assert
        expect(result).toEqual({ rows, count: 1 })
        expect(listBuilder.where).toHaveBeenCalledWith('name', 'ilike', '%squat%')
        expect(countBuilder.where).toHaveBeenCalledWith('name', 'ilike', '%squat%')
    })

    it('avec category et difficulty → applique les deux filtres', async () => {
        // Arrange
        const rows = [{ id: '3', name: 'Deadlift' }]
        const listBuilder = createKnexBuilderMock({ orderBy: rows })
        const countBuilder = createKnexBuilderMock({ first: { count: 1 } })
        const knexMock: any = jest
            .fn()
            .mockReturnValueOnce(listBuilder)
            .mockReturnValueOnce(countBuilder)
        const service = await buildService(knexMock)

        // Act
        const result = await service.findAll({
            category: 'strength' as any,
            difficulty: 'advanced' as any,
        })

        // Assert
        expect(result).toEqual({ rows, count: 1 })
        expect(listBuilder.where).toHaveBeenCalledWith('category', 'strength')
        expect(listBuilder.where).toHaveBeenCalledWith('difficulty', 'advanced')
        expect(countBuilder.where).toHaveBeenCalledWith('category', 'strength')
        expect(countBuilder.where).toHaveBeenCalledWith('difficulty', 'advanced')
    })

    it('pagination → respecte limit et offset', async () => {
        // Arrange
        const rows = [{ id: '4', name: 'Thruster' }]
        const listBuilder = createKnexBuilderMock({ orderBy: rows })
        const countBuilder = createKnexBuilderMock({ first: { count: 42 } })
        const knexMock: any = jest
            .fn()
            .mockReturnValueOnce(listBuilder)
            .mockReturnValueOnce(countBuilder)
        const service = await buildService(knexMock)

        // Act
        const result = await service.findAll({ limit: '10', offset: '20' })

        // Assert
        expect(result).toEqual({ rows, count: 42 })
        expect(listBuilder.limit).toHaveBeenCalledWith(10)
        expect(listBuilder.offset).toHaveBeenCalledWith(20)
        expect(listBuilder.orderBy).toHaveBeenCalledWith('created_at', 'desc')
    })

    it('avec bodyweight_only → filtre sur bodyweight_only', async () => {
        // Arrange
        const rows = [{ id: '9', name: 'Air Squat', bodyweight_only: true }]
        const listBuilder = createKnexBuilderMock({ orderBy: rows })
        const countBuilder = createKnexBuilderMock({ first: { count: 1 } })
        const knexMock: any = jest
            .fn()
            .mockReturnValueOnce(listBuilder)
            .mockReturnValueOnce(countBuilder)
        const service = await buildService(knexMock)

        // Act
        const result = await service.findAll({ bodyweight_only: true } as any)

        // Assert
        expect(result).toEqual({ rows, count: 1 })
        expect(listBuilder.where).toHaveBeenCalledWith('bodyweight_only', true)
        expect(countBuilder.where).toHaveBeenCalledWith('bodyweight_only', true)
    })
})

describe('ExercisesService.findOne', () => {
    it('cherche par id et renvoie la ligne', async () => {
        // Arrange
        const row = { id: '1', name: 'Air Squat' }
        const builder = createKnexBuilderMock({ first: row })
        const knexMock: any = jest.fn().mockReturnValue(builder)
        const service = await buildService(knexMock)

        // Act
        const result = await service.findOne('1')

        // Assert
        expect(result).toEqual(row)
        expect(knexMock).toHaveBeenCalledWith('exercises')
        expect(builder.where).toHaveBeenCalledWith({ id: '1' })
        expect(builder.first).toHaveBeenCalled()
    })
})

describe('ExercisesService.findByName', () => {
    it('renvoie directement la correspondance exacte sans fallback', async () => {
        // Arrange
        const row = { id: '1', name: 'Air Squat' }
        const exactBuilder = createKnexBuilderMock({ first: row })
        const knexMock: any = jest.fn().mockReturnValue(exactBuilder)
        const service = await buildService(knexMock)

        // Act
        const result = await service.findByName('Air Squat')

        // Assert
        expect(result).toEqual(row)
        expect(exactBuilder.where).toHaveBeenCalledWith({ name: 'Air Squat' })
        // une seule requête = pas de fallback ilike
        expect(knexMock).toHaveBeenCalledTimes(1)
    })

    it('sans correspondance exacte → fallback ilike singulier/pluriel', async () => {
        // Arrange
        const row = { id: '2', name: 'Air Squat' }
        const exactBuilder = createKnexBuilderMock({ first: undefined }) // pas de match exact
        const fallbackBuilder = createKnexBuilderMock({ first: row })
        const knexMock: any = jest
            .fn()
            .mockReturnValueOnce(exactBuilder)
            .mockReturnValueOnce(fallbackBuilder)
        const service = await buildService(knexMock)

        // Act
        const result = await service.findByName('Air Squats')

        // Assert
        expect(result).toEqual(row)
        // enlève le "s" final : "Air Squat"
        expect(fallbackBuilder.where).toHaveBeenCalledWith('name', 'ilike', 'Air Squat')
        expect(fallbackBuilder.orWhere).toHaveBeenCalledWith('name', 'ilike', 'Air Squats')
    })
})

describe('ExercisesService.create', () => {
    it('insère avec un slug généré et renvoie la ligne créée', async () => {
        // Arrange
        const created = { id: '10', name: 'Wall Ball' }
        const builder = createKnexBuilderMock({ returning: [created] })
        const knexMock: any = jest.fn().mockReturnValue(builder)
        const service = await buildService(knexMock)

        // Act
        const result = await service.create({
            name: 'Wall Ball',
            category: 'strength' as any,
            difficulty: 'beginner' as any,
            measurement_type: 'reps' as any,
        })

        // Assert
        expect(result).toEqual(created)
        expect(builder.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Wall Ball',
                slug: 'wall-ball',
                category: 'strength',
                difficulty: 'beginner',
            }),
        )
        expect(builder.returning).toHaveBeenCalledWith('*')
    })
})

describe('ExercisesService.update', () => {
    it('met à jour par id, régénère le slug et renvoie la ligne', async () => {
        // Arrange
        const updated = { id: '5', name: 'Box Jump' }
        const builder = createKnexBuilderMock({ returning: [updated] })
        const knexMock: any = jest.fn().mockReturnValue(builder)
        const service = await buildService(knexMock)

        // Act
        const result = await service.update('5', { name: 'Box Jump' })

        // Assert
        expect(result).toEqual(updated)
        expect(builder.where).toHaveBeenCalledWith({ id: '5' })
        expect(builder.update).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Box Jump', slug: 'box-jump' }),
        )
        expect(builder.returning).toHaveBeenCalledWith('*')
    })
})

describe('ExercisesService.delete', () => {
    it('supprime par id et renvoie { success: true }', async () => {
        // Arrange
        const builder = createKnexBuilderMock({ delete: 1 })
        const knexMock: any = jest.fn().mockReturnValue(builder)
        const service = await buildService(knexMock)

        // Act
        const result = await service.delete('7')

        // Assert
        expect(result).toEqual({ success: true })
        expect(builder.where).toHaveBeenCalledWith({ id: '7' })
        expect(builder.delete).toHaveBeenCalled()
    })
})
