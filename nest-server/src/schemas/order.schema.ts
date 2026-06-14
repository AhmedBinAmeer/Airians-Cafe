import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'MenuItem', required: true })
  menuItem: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  category: string;

  @Prop({ required: true })
  basePrice: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true })
  lineTotal: number;
}

export class Feedback {
  @Prop({ min: 1, max: 5 })
  rating: number;

  @Prop()
  comment: string;

  @Prop()
  createdAt: Date;
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: Types.ObjectId;

  @Prop()
  customerName: string;

  @Prop()
  customerPhone: string;

  @Prop()
  notes: string;

  @Prop({ type: [OrderItem] })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ enum: ['wallet', 'cash', 'transfer'], default: 'cash' })
  paymentMethod: string;

  @Prop({ enum: ['pending', 'paid'], default: 'pending' })
  paymentStatus: string;

  @Prop({ enum: ['placed', 'preparing', 'ready', 'picked_up', 'cancelled'], default: 'placed' })
  status: string;

  @Prop()
  pickupAt: Date;

  @Prop()
  standardSlot: Date;

  @Prop({ required: true, index: true })
  shortCode: string;

  @Prop()
  pickedUpAt: Date;

  @Prop({ type: Feedback })
  feedback: Feedback;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ standardSlot: 1, status: 1 });
OrderSchema.index({ shortCode: 1, status: 1, createdAt: 1 });
