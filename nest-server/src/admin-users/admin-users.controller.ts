import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('api/admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  searchUsers(@Query('q') query: string) {
    return this.adminUsersService.searchUsers(query);
  }

  @Get(':id')
  getUserProfile(@Param('id') id: string) {
    return this.adminUsersService.getUserProfile(id);
  }

  @Patch(':id/block')
  toggleBlock(@Param('id') id: string) {
    return this.adminUsersService.toggleBlock(id);
  }

  @Post(':id/wallet')
  topUpWallet(@Param('id') id: string, @Body('amount') amount: number) {
    return this.adminUsersService.topUpWallet(id, amount);
  }
}
