import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { ExercisesService } from './exercises.service'

/**
 * Fabrique un mock chaînable du query builder Knex.
 * Les méthodes de chaînage renvoient le builder ; les méthodes terminales
 * (`orderBy` pour la liste, `first` pour le count) résolvent la valeur finale.
 */
function createKnexBuilderMock(result: {
    rows?: unknown[]
    count?: { count: number | string }
}) {
    const builder: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(result.rows ?? []),
        first: jest.fn().mockResolvedValue(result.count ?? { count: 0 }),
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
        const listBuilder = createKnexBuilderMock({ rows })
        const countBuilder = createKnexBuilderMock({ count: { count: 2 } })
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
        const listBuilder = createKnexBuilderMock({ rows })
        const countBuilder = createKnexBuilderMock({ count: { count: 1 } })
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
        const listBuilder = createKnexBuilderMock({ rows })
        const countBuilder = createKnexBuilderMock({ count: { count: 1 } })
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
        const listBuilder = createKnexBuilderMock({ rows })
        const countBuilder = createKnexBuilderMock({ count: { count: 42 } })
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
})
