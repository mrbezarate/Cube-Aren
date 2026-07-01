import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GameType } from '../../entities/player-stats.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: any) {
    return user;
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(userId, dto);
  }

  @Get('me/wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wallet balance and transactions' })
  getWallet(@CurrentUser('id') userId: string) {
    return this.usersService.getWallet(userId);
  }

  @Post('onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete onboarding — saves games and returns fresh tokens' })
  async completeOnboarding(@CurrentUser('id') userId: string, @Body() dto: OnboardingDto) {
    const updatedUser = await this.usersService.completeOnboarding(userId, dto);
    // Issue fresh tokens that include onboardingCompleted = true
    const tokens = this.authService.generateTokens(updatedUser);
    return {
      user: updatedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  @Get('onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user onboarding answers (favorite games)' })
  getOnboarding(@CurrentUser('id') userId: string) {
    return this.usersService.getOnboardingAnswers(userId);
  }

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 поисков в минуту
  @ApiOperation({ summary: 'Search users by username or display name' })
  @ApiQuery({ name: 'query', required: true, type: String })
  searchUsers(@Query('query') query: string, @CurrentUser('id') userId?: string) {
    return this.usersService.searchUsers(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public user profile' })
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // ========== PROFILE ENDPOINTS ==========
  @Get(':id/profile')
  @ApiOperation({ summary: 'Get user full profile with stats' })
  getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile (bio, avatar, gender, mainGame)' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  // ========== STATS & LEADERBOARD ENDPOINTS ==========
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get all player stats (all games)' })
  getAllStats(@Param('id') id: string) {
    return this.usersService.getAllPlayerStats(id);
  }

  @Get(':id/stats/:game')
  @ApiOperation({ summary: 'Get player stats for specific game' })
  getStats(@Param('id') id: string, @Param('game') game: GameType) {
    return this.usersService.getPlayerStats(id, game);
  }

  @Get('leaderboard/:game')
  @ApiOperation({ summary: 'Get leaderboard for specific game' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLeaderboard(
    @Param('game') game: GameType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getLeaderboard(game, page || 1, limit || 50);
  }

  // ========== FOLLOW ENDPOINTS ==========
  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 подписок в минуту
  @ApiOperation({ summary: 'Follow a user' })
  followUser(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return this.usersService.followUser(userId, targetId);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 отписок в минуту
  @ApiOperation({ summary: 'Unfollow a user' })
  unfollowUser(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return this.usersService.unfollowUser(userId, targetId);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFollowers(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getFollowers(id, page || 1, limit || 20);
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get users this user is following' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFollowing(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getFollowing(id, page || 1, limit || 20);
  }

  @Get(':id/is-following/:targetId')
  @ApiOperation({ summary: 'Check if user is following target' })
  async isFollowing(@Param('id') userId: string, @Param('targetId') targetId: string) {
    const isFollowing = await this.usersService.isFollowing(userId, targetId);
    return { isFollowing };
  }

  @Get(':id/are-friends/:targetId')
  @ApiOperation({ summary: 'Check if two users are friends (mutual follow)' })
  async areFriends(@Param('id') userId: string, @Param('targetId') targetId: string) {
    const areFriends = await this.usersService.areFriends(userId, targetId);
    return { areFriends };
  }

  // ========== PROFILE VIEWS ENDPOINTS ==========
  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track profile view' })
  async trackProfileView(@CurrentUser('id') viewerId: string, @Param('id') profileId: string) {
    await this.usersService.trackProfileView(viewerId, profileId);
    return { message: 'Просмотр зафиксирован' };
  }

  @Get(':id/visitors')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile visitors (last month, owner only)' })
  getProfileVisitors(@CurrentUser('id') currentUserId: string, @Param('id') profileId: string) {
    return this.usersService.getProfileVisitors(profileId, currentUserId);
  }
}
