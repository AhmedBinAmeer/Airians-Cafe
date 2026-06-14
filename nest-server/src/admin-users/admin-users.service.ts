import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Order } from '../schemas/order.schema';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Order.name) private orderModel: Model<Order>
  ) {}

  async searchUsers(query: string) {
    if (!query) {
      return this.userModel.find().select('-password').sort({ createdAt: -1 }).limit(100);
    }
    const regex = new RegExp(query, 'i');
    return this.userModel.find({
      $or: [
        { name: regex },
        { email: regex },
        { phone: regex },
        { studentId: regex }
      ]
    }).select('-password').limit(100);
  }

  async getUserProfile(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const orders = await this.orderModel.find({ user: id }).sort({ createdAt: -1 });
    return { user, orders };
  }

  async toggleBlock(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    return { message: 'User block status updated', isBlocked: user.isBlocked };
  }

  async topUpWallet(id: string, amount: number) {
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Invalid deposit amount');
    }
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.walletBalance += parsedAmount;
    await user.save();
    return { message: 'Wallet topped up', newBalance: user.walletBalance };
  }
}
