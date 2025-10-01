import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignupDto, LoginDto, AuthResponseDto } from './dto/auth.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

interface RequestWithUser extends Request {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    isActive: boolean
  }
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(signupDto)
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: RequestWithUser) {
    return req.user
  }
}
