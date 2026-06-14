import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class WalletService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async deposit(email: string, amount: number, note: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const user = await this.userModel.findOne({ email: String(email).toLowerCase() });
    if (!user) throw new NotFoundException('User not found');

    user.walletBalance += amount;
    user.walletTransactions.push({
      type: 'deposit',
      amount,
      note,
      createdAt: new Date(),
    });

    await user.save();
    return {
      message: 'Deposit successful',
      newBalance: user.walletBalance,
    };
  }

  async getBalance(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return {
      balance: user.walletBalance,
      transactions: user.walletTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    };
  }
}
