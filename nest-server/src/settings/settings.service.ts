import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemSetting } from '../schemas/system-setting.schema';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(SystemSetting.name) private settingModel: Model<SystemSetting>) {}

  async getSettings() {
    const setting = await this.settingModel.findOne({ key: 'ordersClosed' });
    return { ordersClosed: setting ? setting.value : false };
  }

  async toggleOrders() {
    const setting = await this.settingModel.findOne({ key: 'ordersClosed' });
    const newValue = setting ? !setting.value : true;
    
    await this.settingModel.findOneAndUpdate(
      { key: 'ordersClosed' },
      { value: newValue, description: 'Whether ordering is closed' },
      { upsert: true, new: true }
    );
    
    return { ordersClosed: newValue };
  }
}
