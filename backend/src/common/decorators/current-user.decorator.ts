import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import type { AuthenticatedUser } from '../types/authenticated-user'

/** Requires JwtAuthGuard on the route or controller. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedUser => {
  const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>()
  if (!user) {
    throw new UnauthorizedException()
  }
  return user
})
