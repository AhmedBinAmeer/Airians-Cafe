import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MenuItem } from '../schemas/menu-item.schema';

@Injectable()
export class MenuService {
  constructor(@InjectModel(MenuItem.name) private menuItemModel: Model<MenuItem>) {}

  async getActiveMenu() {
    return this.menuItemModel.find({ isActive: true }).sort('category name');
  }

  async getAllMenuItems() {
    return this.menuItemModel.find({}).sort('category name');
  }

  async addMenuItem(data: any) {
    const newItem = new this.menuItemModel(data);
    return newItem.save();
  }

  async updateMenuItem(id: string, data: any) {
    const item = await this.menuItemModel.findByIdAndUpdate(id, data, { new: true });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    return item;
  }

  async toggleStock(id: string) {
    const item = await this.menuItemModel.findById(id);
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    item.isInStock = !item.isInStock;
    await item.save();
    return item;
  }

  async deleteMenuItem(id: string) {
    const item = await this.menuItemModel.findById(id);
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    item.isActive = false;
    await item.save();
    return { message: 'Menu item deleted logically' };
  }
}
