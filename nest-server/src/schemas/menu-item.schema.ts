import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class MenuItem extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 12, min: 1 })
  prepMinutes: number;

  @Prop([String])
  tags: string[];

  @Prop()
  imageUrl: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
  isInStock: boolean;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
MenuItemSchema.index({ name: 'text', description: 'text', category: 'text', tags: 'text' });
