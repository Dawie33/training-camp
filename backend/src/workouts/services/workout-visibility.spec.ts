import knex from 'knex'
import { applyEditPermission, applyVisibility } from './workout-visibility'

// Knex sans connexion : il génère le SQL sans jamais interroger de base
const db = knex({ client: 'pg' })

function whereClause(role?: string) {
  const { sql, bindings } = applyVisibility(db('workouts').select('*'), { id: 'user-1', role }).toSQL()
  return { where: sql.slice(sql.indexOf(' where ') + 7), bindings }
}

describe('applyVisibility', () => {
  it('montre à un utilisateur les workouts partagés publiés et les siens, rien d’autre', () => {
    // Act
    const { where, bindings } = whereClause('user')

    // Assert
    expect(where).toBe(
      '((("workouts"."isPublic" = ? or "workouts"."isPublic" is null) and "workouts"."status" = ?) ' +
        'or "workouts"."created_by_user_id" = ?)'
    )
    expect(bindings).toEqual([true, 'published', 'user-1'])
  })

  it('montre en plus à un admin les brouillons du référentiel partagé, jamais les workouts privés', () => {
    // Act
    const { where, bindings } = whereClause('admin')

    // Assert
    expect(where).toBe(
      '((("workouts"."isPublic" = ? or "workouts"."isPublic" is null) and "workouts"."status" = ?) ' +
        'or "workouts"."created_by_user_id" = ? ' +
        'or (("workouts"."isPublic" = ? or "workouts"."isPublic" is null) and "workouts"."created_by_user_id" is null))'
    )
    expect(bindings).toEqual([true, 'published', 'user-1', true])
  })
})

describe('applyEditPermission', () => {
  function editClause(role?: string) {
    const { sql, bindings } = applyEditPermission(db('workouts').where({ id: 'w-1' }).del(), {
      id: 'user-1',
      role,
    }).toSQL()
    return { where: sql.slice(sql.indexOf(' where ') + 7), bindings }
  }

  it('ne laisse un utilisateur modifier ou supprimer que ses propres workouts', () => {
    // Act
    const { where, bindings } = editClause('user')

    // Assert — ni le référentiel partagé, ni les workouts des autres
    expect(where).toBe('"id" = ? and ("workouts"."created_by_user_id" = ?)')
    expect(bindings).toEqual(['w-1', 'user-1'])
  })

  it('laisse en plus un admin gérer le référentiel partagé, jamais les workouts privés des autres', () => {
    // Act
    const { where, bindings } = editClause('admin')

    // Assert
    expect(where).toBe(
      '"id" = ? and ("workouts"."created_by_user_id" = ? ' +
        'or (("workouts"."isPublic" = ? or "workouts"."isPublic" is null) and "workouts"."created_by_user_id" is null))'
    )
    expect(bindings).toEqual(['w-1', 'user-1', true])
  })
})
