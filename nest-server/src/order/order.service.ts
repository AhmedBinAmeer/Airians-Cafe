import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { User } from '../schemas/user.schema';
import { MenuItem } from '../schemas/menu-item.schema';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItem>,
    private notificationsService: NotificationsService,
  ) {}

  async createOrder(userId: string, data: any) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (!data.items || !data.items.length) {
      throw new BadRequestException('Order must contain items');
    }

    const orderItems: any[] = [];
    let totalAmount = 0;

    for (const item of data.items) {
      const menuObj = await this.menuItemModel.findById(item.menuItem);
      if (!menuObj) throw new NotFoundException(`Menu item ${item.menuItem} not found`);
      if (!menuObj.isActive || !menuObj.isInStock) {
        throw new BadRequestException(`Menu item ${menuObj.name} is unavailable`);
      }

      const lineTotal = menuObj.price * item.quantity;
      totalAmount += lineTotal;

      orderItems.push({
        menuItem: menuObj._id,
        name: menuObj.name,
        category: menuObj.category,
        basePrice: menuObj.price,
        quantity: item.quantity,
        lineTotal,
      });
    }

    if (data.paymentMethod === 'wallet') {
      if (user.walletBalance < totalAmount) {
        throw new BadRequestException('Insufficient wallet balance');
      }
      user.walletBalance -= totalAmount;
      await user.save();
    }

    const shortCode = crypto.randomBytes(2).toString('hex').toUpperCase();

    const newOrder = new this.orderModel({
      customer: user._id,
      customerName: user.name,
      customerPhone: user.phone,
      notes: data.notes || '',
      items: orderItems,
      totalAmount,
      paymentMethod: data.paymentMethod || 'cash',
      paymentStatus: data.paymentMethod === 'wallet' ? 'paid' : 'pending',
      status: 'placed',
      pickupAt: data.pickupAt,
      shortCode,
    });

    const savedOrder = await newOrder.save();

    // Fire notification in background — don't block the HTTP response
    this.notificationsService.sendOrderStatus(user.name, user.email, user.phone, savedOrder, 'placed').catch(() => {});

    return savedOrder;
  }

  async getUserOrders(userId: string) {
    return this.orderModel.find({ customer: userId }).sort('-createdAt');
  }

  async getAdminTimeline() {
    return this.orderModel.find({ status: { $ne: 'picked_up' } }).sort('pickupAt');
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.orderModel.findByIdAndUpdate(id, { status }, { new: true }).populate('customer');
    if (!order) throw new NotFoundException('Order not found');

    const user: any = order.customer;
    if (user && (status === 'ready' || status === 'picked_up')) {
      // Fire notification in background — don't block the HTTP response
      this.notificationsService.sendOrderStatus(user.name, user.email, user.phone, order, status).catch(() => {});
    }

    return order;
  }

  async getAdminOrders(view: string, date: string) {
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(queryDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const match = { 
      createdAt: { $gte: queryDate, $lt: nextDate },
      status: { $nin: ['picked_up', 'cancelled'] }
    };

    if (view === 'bulk') {
      const summary = await this.orderModel.aggregate([
        { $match: match },
        { $match: { status: { $in: ['placed', 'preparing'] } } },
        { $unwind: '$items' },
        { $group: { _id: { name: '$items.name' }, quantity: { $sum: '$items.quantity' } } },
        { $sort: { quantity: -1 } }
      ]);
      return { summary };
    } else {
      const orders = await this.orderModel.find(match).sort({ createdAt: -1 });
      return { orders };
    }
  }

  async getAdminHistory() {
    return this.orderModel.find().sort({ createdAt: -1 }).populate('customer');
  }

  async exportCsv() {
    const orders = await this.orderModel.find().sort({ createdAt: -1 }).lean();
    let csv = 'ShortCode,Customer,Phone,Total,Status,Date\n';
    orders.forEach((o: any) => {
      const dateStr = new Date((o as any).createdAt).toISOString();
      const safeName = (o.customerName || '').replace(/"/g, '""');
      const safePhone = o.customerPhone || '';
      csv += `${o.shortCode},"${safeName}",${safePhone},${o.totalAmount},${o.status},${dateStr}\n`;
    });
    return csv;
  }

  async addFeedback(orderId: string, userId: string, feedback: { rating: number; comment?: string }) {
    if (!feedback || !feedback.rating || feedback.rating < 1 || feedback.rating > 5) {
      throw new BadRequestException('Valid rating (1-5) is required');
    }
    
    const order = await this.orderModel.findOne({ _id: orderId, customer: userId });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'picked_up') {
      throw new BadRequestException('Can only rate completed orders');
    }
    if (order.feedback?.rating) {
      throw new BadRequestException('Order already rated');
    }

    order.feedback = {
      rating: feedback.rating,
      comment: feedback.comment || '',
      createdAt: new Date(),
    };
    
    return order.save();
  }

  async quickFulfill(code: string) {
    if (!code) throw new BadRequestException('Code required');
    const order = await this.orderModel.findOne({ shortCode: code, status: { $in: ['placed', 'preparing', 'ready'] } }).populate('customer');
    if (!order) throw new NotFoundException('Order not found or already completed');
    order.status = 'picked_up';
    await order.save();

    const user: any = order.customer;
    if (user) {
      // Fire notification in background — don't block the HTTP response
      this.notificationsService.sendOrderStatus(user.name, user.email, user.phone, order, 'picked_up').catch(() => {});
    }

    return order;
  }
}
