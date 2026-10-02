import { Body, Controller, Get, HttpCode, Post, Request, Res, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import type { Response } from 'express'
import { AuthService } from './auth.service'
import { LoginDto, SignupDto } from './dto/auth.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import type { RequestWithUser } from './types/auth.types'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  private setCookieToken(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production'
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isProduction,
      // 'lax' suffit : le front appelle l'API via le rewrite Next.js (same-origin).
      // Le navigateur n'envoie alors pas le cookie sur un POST venu d'un autre site (protection CSRF).
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
    })
  }

  @Post('signup')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async signup(
    @Body() signupDto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signup(signupDto)
    this.setCookieToken(res, result.access_token)
    return { user: result.user }
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto)
    this.setCookieToken(res, result.access_token)
    return { user: result.user }
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env.NODE_ENV === 'production'
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    })
    return { message: 'Logged out' }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: RequestWithUser) {
    return req.user
  }
}
