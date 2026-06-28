import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthProvider, UserRole } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) throw new ConflictException('Username already taken');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      role: dto.role || UserRole.PARTICIPANT,
      oauthProvider: OAuthProvider.LOCAL,
      credits: Number(this.configService.get('INITIAL_CREDITS', 1000)),
    });

    const tokens = this.generateTokens(user);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // Remove passwordHash from response
    const { passwordHash, ...userWithoutPassword } = user;
    const tokens = this.generateTokens(userWithoutPassword);
    return { user: userWithoutPassword, ...tokens };
  }

  generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted ?? false,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET', 'fallback_secret'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'fallback_refresh'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'fallback_refresh'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const { passwordHash, ...userWithoutPassword } = user as any;
      const tokens = this.generateTokens(userWithoutPassword);
      return { user: userWithoutPassword, ...tokens };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async handleOAuthLogin(
    profile: {
      email: string;
      username: string;
      avatarUrl?: string;
      oauthId: string;
    },
    provider: 'google' | 'discord',
  ) {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      // Ensure unique username
      let username = profile.username;
      const existing = await this.usersService.findByUsername(username);
      if (existing) username = `${username}_${Math.floor(Math.random() * 9999)}`;

      user = await this.usersService.create({
        username,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        oauthId: profile.oauthId,
        oauthProvider: provider as OAuthProvider,
        role: UserRole.PARTICIPANT,
        credits: Number(this.configService.get('INITIAL_CREDITS', 1000)),
      });
    }

    return user;
  }
}
