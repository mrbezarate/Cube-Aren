import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdatePrivacySettingsDto } from './dto/update-privacy.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notifications.dto';
import { UpdateUserPreferencesDto } from './dto/update-preferences.dto';
import { BlockUserDto } from './dto/block-user.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ============ Privacy Settings ============

  @Get('privacy')
  async getPrivacySettings(@CurrentUser('id') userId: string) {
    return this.settingsService.getPrivacySettings(userId);
  }

  @Put('privacy')
  async updatePrivacySettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePrivacySettingsDto,
  ) {
    return this.settingsService.updatePrivacySettings(userId, dto);
  }

  @Delete('privacy/history/visitors')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearProfileVisitorsHistory(@CurrentUser('id') userId: string) {
    await this.settingsService.clearProfileVisitorsHistory(userId);
  }

  @Delete('privacy/history/tournaments')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearTournamentHistory(@CurrentUser('id') userId: string) {
    await this.settingsService.clearTournamentHistory(userId);
  }

  // ============ Notification Settings ============

  @Get('notifications')
  async getNotificationSettings(@CurrentUser('id') userId: string) {
    return this.settingsService.getNotificationSettings(userId);
  }

  @Put('notifications')
  async updateNotificationSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.settingsService.updateNotificationSettings(userId, dto);
  }

  // ============ User Preferences ============

  @Get('preferences')
  async getUserPreferences(@CurrentUser('id') userId: string) {
    return this.settingsService.getUserPreferences(userId);
  }

  @Put('preferences')
  async updateUserPreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserPreferencesDto,
  ) {
    return this.settingsService.updateUserPreferences(userId, dto);
  }

  // ============ Blocked Users ============

  @Get('blocked')
  async getBlockedUsers(@CurrentUser('id') userId: string) {
    const blocks = await this.settingsService.getBlockedUsers(userId);
    
    // Format response
    return blocks.map((block) => ({
      id: block.id,
      userId: block.userId,
      blockedUserId: block.blockedUserId,
      blockedUser: {
        id: block.blockedUser.id,
        username: block.blockedUser.username,
        displayName: block.blockedUser.displayName,
        avatarUrl: block.blockedUser.avatarUrl,
      },
      reason: block.reason,
      blockedAt: block.blockedAt,
    }));
  }

  @Post('blocked/:userId')
  async blockUser(
    @CurrentUser('id') userId: string,
    @Param('userId') blockedUserId: string,
    @Body() dto: BlockUserDto,
  ) {
    return this.settingsService.blockUser(userId, blockedUserId, dto.reason);
  }

  @Delete('blocked/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblockUser(
    @CurrentUser('id') userId: string,
    @Param('userId') blockedUserId: string,
  ) {
    await this.settingsService.unblockUser(userId, blockedUserId);
  }
}
