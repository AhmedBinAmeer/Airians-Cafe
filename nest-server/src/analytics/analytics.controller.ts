import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('api/admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('earnings')
  getEarnings() {
    return this.analyticsService.getEarnings();
  }

  @Get('feedback')
  getFeedback() {
    return this.analyticsService.getFeedback();
  }

  @Get('today')
  getTodaySales() {
    return this.analyticsService.getTodaySales();
  }
}
