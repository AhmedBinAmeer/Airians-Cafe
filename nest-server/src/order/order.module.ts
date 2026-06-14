import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order, OrderSchema } from '../schemas/order.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { MenuItem, MenuItemSchema } from '../schemas/menu-item.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
