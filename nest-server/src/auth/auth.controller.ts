import { Controller, Post, Body, Get, UseGuards, Request, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  @Post('admin/login')
  async adminLogin(@Body() body: any) {
    return this.authService.adminLogin(body.email, body.password);
  }

  @Post('google')
  async googleLogin(@Body() body: { idToken: string }) {
    return this.authService.googleLogin(body.idToken);
  }

  @Post('request-otp')
  async requestOtp(@Body() body: any) {
    return this.authService.requestOtp(body);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: any) {
    return this.authService.verifyOtp(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('onboarding')
  async completeOnboarding(@Request() req: any, @Body() body: { phone: string; role: string }) {
    return this.authService.completeOnboarding(req.user._id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    const user = req.user;
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified,
      walletBalance: user.walletBalance,
    };
  }
}
