import { UnauthorizedException } from '@nestjs/common'
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants'
import type { CustomParamFactory } from '@nestjs/common/interfaces'
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host'
import type { AuthenticatedUser } from '../types/authenticated-user'
import { CurrentUser } from './current-user.decorator'

class TestController {
  getUser(@CurrentUser() user: AuthenticatedUser) {
    return user
  }
}

const metadata: Record<string, { factory: CustomParamFactory<unknown, AuthenticatedUser> }> = Reflect.getMetadata(
  ROUTE_ARGS_METADATA,
  TestController,
  'getUser'
)
const { factory } = Object.values(metadata)[0]

describe('CurrentUser', () => {
  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
    isActive: true,
  }

  it('renvoie le profil complet attache par le guard, sans utiliser les donnees du client', () => {
    const context = new ExecutionContextHost([
      { user, body: { user: { id: 'other-user' } }, query: { userId: 'other-user' } },
    ])

    expect(factory(undefined, context)).toBe(user)
  })

  it('refuse une requete sans utilisateur authentifie', () => {
    const context = new ExecutionContextHost([{ body: { user } }])

    expect(() => factory(undefined, context)).toThrow(UnauthorizedException)
  })
})
