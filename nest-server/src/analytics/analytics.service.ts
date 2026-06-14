import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';

@Injectable()
export class AnalyticsService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = await this.orderModel.find({ createdAt: { $gte: today } });
    
    const revenue = ordersToday.reduce((sum, order) => sum + order.totalAmount, 0);
    const count = ordersToday.length;

    return {
      revenue,
      count,
      popularItems: [],
    };
  }

  async getEarnings() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const orders = await this.orderModel.find({
      createdAt: { $gte: thirtyDaysAgo },
      status: { $ne: 'cancelled' }
    });

    const dailyStats: Record<string, { revenue: number; orders: number }> = {};
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyStats[dateStr] = { revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
      const dateStr = new Date((order as any).createdAt).toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].revenue += order.totalAmount;
        dailyStats[dateStr].orders += 1;
      }
    });

    return Object.keys(dailyStats).map(date => ({
      date,
      revenue: dailyStats[date].revenue,
      orders: dailyStats[date].orders
    }));
  }

  async getFeedback() {
    return this.orderModel.find({ 'feedback.rating': { $exists: true, $ne: null } })
      .sort({ 'feedback.createdAt': -1 })
      .limit(50);
  }

  async getTodaySales() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todayOrders, yesterdayOrders] = await Promise.all([
      this.orderModel.find({ createdAt: { $gte: today }, status: { $ne: 'cancelled' } }),
      this.orderModel.find({ createdAt: { $gte: yesterday, $lt: today }, status: { $ne: 'cancelled' } })
    ]);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const itemCounts: Record<string, number> = {};
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });

    let topItem: any = null;
    let maxQty = 0;
    Object.keys(itemCounts).forEach(name => {
      if (itemCounts[name] > maxQty) {
        maxQty = itemCounts[name];
        topItem = { _id: name, qty: maxQty };
      }
    });

    return {
      today: { revenue: todayRevenue, orders: todayOrders.length },
      yesterday: { revenue: yesterdayRevenue, orders: yesterdayOrders.length },
      topItem
    };
  }
}
