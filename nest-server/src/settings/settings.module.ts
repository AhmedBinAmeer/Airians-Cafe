import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SystemSetting, SystemSettingSchema } from '../schemas/system-setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SystemSetting.name, schema: SystemSettingSchema }])
  ],
  controllers: [SettingsController],
  providers: [SettingsService]
})
export class SettingsModule {}
