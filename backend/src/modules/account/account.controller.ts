import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // ============ Email Management ============

  @Post('change-email')
  async changeEmail(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangeEmailDto,
  ) {
    const user = await this.accountService.changeEmail(userId, dto.newEmail);
    return {
      message: 'Email changed successfully',
      email: user.email,
    };
  }

  // ============ Password Management ============

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.accountService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );

    return {
      message: 'Password changed successfully',
    };
  }

  // ============ 2FA Management ============

  @Post('2fa/enable')
  async enable2FA(@CurrentUser('id') userId: string) {
    const result = await this.accountService.enable2FA(userId);
    return {
      message: 'Scan this QR code with your authenticator app',
      ...result,
    };
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disable2FA(@CurrentUser('id') userId: string) {
    await this.accountService.disable2FA(userId);
    return {
      message: '2FA disabled successfully',
    };
  }

  @Post('2fa/verify')
  async verify2FA(
    @CurrentUser('id') userId: string,
    @Body('token') token: string,
  ) {
    const isValid = await this.accountService.verify2FA(userId, token);
    return {
      valid: isValid,
      message: isValid ? '2FA verified successfully' : 'Invalid 2FA token',
    };
  }

  // ============ OAuth Connections ============

  @Post('oauth/:provider/connect')
  async connectOAuth(
    @CurrentUser('id') userId: string,
    @Param('provider') provider: 'google' | 'discord',
    @Body('oauthId') oauthId: string,
  ) {
    await this.accountService.connectOAuth(userId, provider, oauthId);
    return {
      message: `${provider} account connected successfully`,
    };
  }

  @Delete('oauth/:provider/disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnectOAuth(
    @CurrentUser('id') userId: string,
    @Param('provider') provider: 'google' | 'discord',
  ) {
    await this.accountService.disconnectOAuth(userId, provider);
    return {
      message: `${provider} account disconnected successfully`,
    };
  }

  // ============ Account Deletion ============

  @Post('delete/request')
  async requestAccountDeletion(@CurrentUser('id') userId: string) {
    return this.accountService.requestAccountDeletion(userId);
  }

  @Post('delete/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelAccountDeletion(@CurrentUser('id') userId: string) {
    await this.accountService.cancelAccountDeletion(userId);
    return {
      message: 'Account deletion cancelled',
    };
  }

  @Delete('delete/now')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccountNow(@CurrentUser('id') userId: string) {
    await this.accountService.deleteAccountNow(userId);
  }

  // ============ Data Export ============

  @Get('export')
  async exportUserData(@CurrentUser('id') userId: string) {
    return this.accountService.exportUserData(userId);
  }

  // ============ Active Sessions ============

  @Get('sessions')
  async getActiveSessions(@CurrentUser('id') userId: string) {
    const sessions = await this.accountService.getActiveSessions(userId);
    return { sessions };
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    await this.accountService.terminateSession(userId, sessionId);
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateAllSessions(@CurrentUser('id') userId: string) {
    await this.accountService.terminateAllSessions(userId);
  }
}
