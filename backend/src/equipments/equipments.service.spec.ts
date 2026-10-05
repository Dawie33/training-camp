import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { EquipmentsService } from './equipments.service'

/**
 * Mock chaînable du query builder Knex (voir skill testing-knex-nestjs).
 * Les méthodes de chaînage renvoient le builder ; les terminales résolvent la valeur.
 */
function createKnexBuilderMock(
  terminal: {
    orderBy?: unknown[]
    first?: unknown
    returning?: unknown[]
    delete?: number
  } = {}
) {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockResolvedValue(terminal.orderBy ?? []),
    first: jest.fn().mockResolvedValue(terminal.first),
    returning: jest.fn().mockResolvedValue(terminal.returning ?? []),
    delete: jest.fn().mockResolvedValue(terminal.delete ?? 1),
  }
  return builder
}

async function buildService(knexMock: any) {
  const moduleRef = await Test.createTestingModule({
    providers: [EquipmentsService, { provide: getConnectionToken(), useValue: knexMock }],
  }).compile()

  return moduleRef.get(EquipmentsService)
}

describe('EquipmentsService.findAll', () => {
  it('sans filtre → renvoie { rows, count }', async () => {
    // Arrange
    const rows = [
      { id: '1', label: 'Barbell' },
      { id: '2', label: 'Kettlebell' },
    ]
    const listBuilder = createKnexBuilderMock({ orderBy: rows })
    const countBuilder = createKnexBuilderMock({ first: { count: 2 } })
    const knexMock: any = jest.fn().mockReturnValueOnce(listBuilder).mockReturnValueOnce(countBuilder)
    const service = await buildService(knexMock)

    // Act
    const result = await service.findAll({})

    // Assert
    expect(result).toEqual({ rows, count: 2 })
    expect(knexMock).toHaveBeenCalledWith('equipments')
    expect(listBuilder.where).not.toHaveBeenCalled()
  })

  it('avec search → applique un where ilike sur label', async () => {
    // Arrange
    const rows = [{ id: '1', label: 'Barbell' }]
    const listBuilder = createKnexBuilderMock({ orderBy: rows })
    const countBuilder = createKnexBuilderMock({ first: { count: 1 } })
    const knexMock: any = jest.fn().mockReturnValueOnce(listBuilder).mockReturnValueOnce(countBuilder)
    const service = await buildService(knexMock)

    // Act
    const result = await service.findAll({ search: 'bar' })

    // Assert
    expect(result).toEqual({ rows, count: 1 })
    expect(listBuilder.where).toHaveBeenCalledWith('label', 'ilike', '%bar%')
  })

  it('pagination → respecte limit et offset', async () => {
    // Arrange
    const rows = [{ id: '3', label: 'Rings' }]
    const listBuilder = createKnexBuilderMock({ orderBy: rows })
    const countBuilder = createKnexBuilderMock({ first: { count: 7 } })
    const knexMock: any = jest.fn().mockReturnValueOnce(listBuilder).mockReturnValueOnce(countBuilder)
    const service = await buildService(knexMock)

    // Act
    const result = await service.findAll({ limit: 5, offset: 10 })

    // Assert
    expect(result).toEqual({ rows, count: 7 })
    expect(listBuilder.limit).toHaveBeenCalledWith(5)
    expect(listBuilder.offset).toHaveBeenCalledWith(10)
    expect(listBuilder.orderBy).toHaveBeenCalledWith('created_at', 'desc')
  })
})

describe('EquipmentsService.findOne', () => {
  it("renvoie l'équipement trouvé par id", async () => {
    // Arrange
    const row = { id: '1', label: 'Barbell' }
    const builder = createKnexBuilderMock({ first: row })
    const knexMock: any = jest.fn().mockReturnValue(builder)
    const service = await buildService(knexMock)

    // Act
    const result = await service.findOne('1')

    // Assert
    expect(result).toEqual(row)
    expect(builder.where).toHaveBeenCalledWith({ id: '1' })
  })

  it("lève BadRequestException si l'id est manquant", async () => {
    // Arrange
    const knexMock: any = jest.fn()
    const service = await buildService(knexMock)

    // Act + Assert
    await expect(service.findOne('')).rejects.toThrow(BadRequestException)
    // la requête n'est jamais construite
    expect(knexMock).not.toHaveBeenCalled()
  })

  it("lève NotFoundException si l'équipement est introuvable", async () => {
    // Arrange
    const builder = createKnexBuilderMock({ first: undefined })
    const knexMock: any = jest.fn().mockReturnValue(builder)
    const service = await buildService(knexMock)

    // Act + Assert
    await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException)
  })
})
