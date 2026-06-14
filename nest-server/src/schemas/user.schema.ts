import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export class Otp {
  @Prop()
  codeHash: string;

  @Prop()
  expiresAt: Date;
}

export class WalletTransaction {
  @Prop({ required: true, enum: ['deposit', 'payment', 'refund'] })
  type: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop()
  note: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  email: string;

  @Prop({ trim: true, default: '' })
  phone: string;

  @Prop({ enum: ['student', 'faculty', 'staff', 'guest', 'admin'], default: 'student' })
  role: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  passwordHash: string;

  @Prop({ unique: true, sparse: true })
  googleId?: string;

  @Prop()
  googleUid: string;

  @Prop()
  studentId: string;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ default: 0, min: 0 })
  walletBalance: number;

  @Prop({ type: [WalletTransaction], default: [] })
  walletTransactions: WalletTransaction[];

  @Prop({ type: Otp })
  otp: Otp;

  async setPassword(password: string): Promise<void> {
    this.passwordHash = await bcrypt.hash(password, 12);
  }

  async checkPassword(password: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(password, this.passwordHash);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.methods.setPassword = async function (password: string) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

UserSchema.methods.checkPassword = function (password: string) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};
