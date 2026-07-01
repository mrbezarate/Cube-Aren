import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrivacySettings } from '../../entities/privacy-settings.entity';
import { NotificationSettings } from '../../entities/notification-settings.entity';
import { UserPreferences } from '../../entities/user-preferences.entity';
import { BlockedUser } from '../../entities/blocked-user.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PrivacySettings,
      NotificationSettings,
      UserPreferences,
      BlockedUser,
      User,
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
