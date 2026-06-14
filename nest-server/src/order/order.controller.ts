import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  createOrder(@Request() req: any, @Body() body: any) {
    return this.orderService.createOrder(req.user._id, body);
  }

  @Get('mine')
  getUserOrders(@Request() req: any) {
    return this.orderService.getUserOrders(req.user._id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin')
  getAdminOrders(@Query('view') view: string, @Query('date') date: string) {
    return this.orderService.getAdminOrders(view, date);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/history')
  getAdminHistory() {
    return this.orderService.getAdminHistory();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/export-csv')
  async exportCsv(@Res() res: any) {
    const csvContent = await this.orderService.exportCsv();
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="orders-export.csv"`);
    return res.send(csvContent);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('quick-fulfill')
  quickFulfill(@Body('code') code: string) {
    return this.orderService.quickFulfill(code);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/status')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.orderService.updateOrderStatus(id, status);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put(':id/status')
  updateOrderStatusPut(@Param('id') id: string, @Body('status') status: string) {
    return this.orderService.updateOrderStatus(id, status);
  }

  @Post(':id/feedback')
  addFeedback(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.orderService.addFeedback(id, req.user._id, body);
  }
}
