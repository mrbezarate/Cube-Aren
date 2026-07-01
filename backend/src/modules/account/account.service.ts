import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, OAuthProvider } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ============ Email Management ============

  async changeEmail(userId: string, newEmail: string): Promise<User> {
    // Check if email is already taken
    const existingUser = await this.userRepository.findOne({
      where: { email: newEmail },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestException('Email already in use');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.email = newEmail;
    return this.userRepository.save(user);
  }

  // ============ Password Management ============

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash', 'oauthProvider'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user uses local auth
    if (user.oauthProvider !== OAuthProvider.LOCAL) {
      throw new BadRequestException(
        `Cannot change password for ${user.oauthProvider} account`,
      );
    }

    if (!user.passwordHash) {
      throw new BadRequestException('User has no password set');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.userRepository.update(userId, {
      passwordHash: hashedPassword,
    });
  }

  // ============ 2FA Management ============

  async enable2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    // TODO: Implement 2FA with speakeasy or similar library
    // For now, return mock data
    return {
      secret: 'MOCK_SECRET_KEY',
      qrCode: 'data:image/png;base64,mock_qr_code',
    };
  }

  async disable2FA(userId: string): Promise<void> {
    // TODO: Implement 2FA disable
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // For now, just return success
    return;
  }

  async verify2FA(userId: string, token: string): Promise<boolean> {
    // TODO: Implement 2FA verification with speakeasy
    // For now, accept any 6-digit token
    return token.length === 6 && /^\d+$/.test(token);
  }

  // ============ OAuth Connections ============

  async connectOAuth(
    userId: string,
    provider: 'google' | 'discord',
    oauthId: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // For now, just save the connection info
    // In production, you'd want separate table for oauth connections
    return user;
  }

  async disconnectOAuth(
    userId: string,
    provider: 'google' | 'discord',
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if this is the only auth method
    if (user.oauthProvider === provider && !user.passwordHash) {
      throw new BadRequestException(
        'Cannot disconnect the only authentication method',
      );
    }

    // For now, just return success
    return;
  }

  // ============ Account Deletion ============

  async requestAccountDeletion(userId: string): Promise<{ message: string; deletionDate: Date }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Schedule deletion in 30 days
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    // TODO: In production, mark user for deletion and schedule job
    // For now, just return the planned deletion date

    return {
      message: 'Account deletion scheduled. You have 30 days to cancel.',
      deletionDate,
    };
  }

  async cancelAccountDeletion(userId: string): Promise<void> {
    // TODO: Cancel scheduled deletion
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // For now, just return success
    return;
  }

  async deleteAccountNow(userId: string): Promise<void> {
    // Permanently delete user (use with caution!)
    await this.userRepository.delete(userId);
  }

  // ============ Data Export ============

  async exportUserData(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['stats', 'teams'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: Include all user data (tournaments, bets, messages, etc.)
    // This is a basic implementation for GDPR compliance

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        country: user.country,
        city: user.city,
        gender: user.gender,
        createdAt: user.createdAt,
      },
      // Add more data as needed
      exportDate: new Date(),
    };
  }

  // ============ Active Sessions ============

  async getActiveSessions(userId: string): Promise<any[]> {
    // TODO: Implement session tracking
    // For now, return mock data
    return [
      {
        id: '1',
        device: 'Windows PC',
        browser: 'Chrome',
        ip: '192.168.1.1',
        location: 'Moscow, Russia',
        lastActive: new Date(),
        current: true,
      },
    ];
  }

  async terminateSession(userId: string, sessionId: string): Promise<void> {
    // TODO: Implement session termination
    return;
  }

  async terminateAllSessions(userId: string): Promise<void> {
    // TODO: Implement terminating all sessions except current
    return;
  }
}
