import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrivacySettings } from '../../entities/privacy-settings.entity';
import { NotificationSettings } from '../../entities/notification-settings.entity';
import { UserPreferences } from '../../entities/user-preferences.entity';
import { BlockedUser } from '../../entities/blocked-user.entity';
import { User } from '../../entities/user.entity';
import { UpdatePrivacySettingsDto } from './dto/update-privacy.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notifications.dto';
import { UpdateUserPreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(PrivacySettings)
    private privacySettingsRepository: Repository<PrivacySettings>,
    @InjectRepository(NotificationSettings)
    private notificationSettingsRepository: Repository<NotificationSettings>,
    @InjectRepository(UserPreferences)
    private userPreferencesRepository: Repository<UserPreferences>,
    @InjectRepository(BlockedUser)
    private blockedUserRepository: Repository<BlockedUser>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ============ Privacy Settings ============

  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    let settings = await this.privacySettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if not exists
      settings = this.privacySettingsRepository.create({ userId });
      await this.privacySettingsRepository.save(settings);
    }

    return settings;
  }

  async updatePrivacySettings(
    userId: string,
    dto: UpdatePrivacySettingsDto,
  ): Promise<PrivacySettings> {
    let settings = await this.getPrivacySettings(userId);

    // Update only provided fields
    Object.assign(settings, dto);

    return this.privacySettingsRepository.save(settings);
  }

  async clearProfileVisitorsHistory(userId: string): Promise<void> {
    // TODO: Implement clearing profile_views table
    // For now, just return success
    return;
  }

  async clearTournamentHistory(userId: string): Promise<void> {
    // TODO: Implement clearing tournament_views table
    // For now, just return success
    return;
  }

  // ============ Notification Settings ============

  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    let settings = await this.notificationSettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if not exists
      settings = this.notificationSettingsRepository.create({ userId });
      await this.notificationSettingsRepository.save(settings);
    }

    return settings;
  }

  async updateNotificationSettings(
    userId: string,
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    let settings = await this.getNotificationSettings(userId);

    // Update only provided fields
    Object.assign(settings, dto);

    return this.notificationSettingsRepository.save(settings);
  }

  // ============ User Preferences ============

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    let preferences = await this.userPreferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences if not exists
      preferences = this.userPreferencesRepository.create({ userId });
      await this.userPreferencesRepository.save(preferences);
    }

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    dto: UpdateUserPreferencesDto,
  ): Promise<UserPreferences> {
    let preferences = await this.getUserPreferences(userId);

    // Update only provided fields
    Object.assign(preferences, dto);

    return this.userPreferencesRepository.save(preferences);
  }

  // ============ Blocked Users ============

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    return this.blockedUserRepository.find({
      where: { userId },
      relations: ['blockedUser'],
      order: { blockedAt: 'DESC' },
    });
  }

  async blockUser(
    userId: string,
    blockedUserId: string,
    reason?: string,
  ): Promise<BlockedUser> {
    // Validate
    if (userId === blockedUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Check if user exists
    const userToBlock = await this.userRepository.findOne({
      where: { id: blockedUserId },
    });
    if (!userToBlock) {
      throw new NotFoundException('User not found');
    }

    // Check if already blocked
    const existing = await this.blockedUserRepository.findOne({
      where: { userId, blockedUserId },
    });
    if (existing) {
      throw new BadRequestException('User already blocked');
    }

    // Create block
    const block = this.blockedUserRepository.create({
      userId,
      blockedUserId,
      reason,
    });

    return this.blockedUserRepository.save(block);
  }

  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    const block = await this.blockedUserRepository.findOne({
      where: { userId, blockedUserId },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    await this.blockedUserRepository.remove(block);
  }

  async isUserBlocked(userId: string, blockedUserId: string): Promise<boolean> {
    const count = await this.blockedUserRepository.count({
      where: { userId, blockedUserId },
    });
    return count > 0;
  }
}
