import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  getBalance(@Request() req: any) {
    return this.walletService.getBalance(req.user._id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('deposit')
  deposit(@Body() body: { email: string; amount: number; note?: string }) {
    return this.walletService.deposit(body.email, body.amount, body.note || 'Admin deposit');
  }
}
