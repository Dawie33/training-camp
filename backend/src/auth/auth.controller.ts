import { Body, Controller, Get, Patch, Post, Req, Request, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthResponseDto, LoginDto, SignupDto } from './dto/auth.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
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
  constructor(private authService: AuthService) { }

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

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getFullProfile(@Request() req: RequestWithUser) {
    return this.authService.getFullProfile(req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto)
  }
}
