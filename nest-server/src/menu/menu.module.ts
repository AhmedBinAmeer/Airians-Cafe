import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuItem, MenuItemSchema } from '../schemas/menu-item.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: MenuItem.name, schema: MenuItemSchema }])],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
