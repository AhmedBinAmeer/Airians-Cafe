import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class SystemSetting extends Document {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  value: any;

  @Prop()
  description: string;
}

export const SystemSettingSchema = SchemaFactory.createForClass(SystemSetting);
