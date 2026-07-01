import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChatGateway } from '../chat/chat.gateway';

@ApiTags('Friends')
@Controller('friends')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FriendsController {
  constructor(
    private readonly friendsService: FriendsService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  // Подписаться на пользователя (как в TikTok)
  @Post('follow/:userId')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async followUser(@Param('userId') userId: string, @Req() req: any) {
    const result = await this.friendsService.followUser(req.user.id, userId);
    
    // Отправляем WebSocket уведомление получателю
    this.chatGateway.sendFollowNotification(userId, req.user.id);
    
    return result;
  }

  // Отписаться от пользователя
  @Delete('unfollow/:userId')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async unfollowUser(@Param('userId') userId: string, @Req() req: any) {
    const result = await this.friendsService.unfollowUser(req.user.id, userId);
    
    // Отправляем WebSocket уведомление получателю
    this.chatGateway.sendUnfollowNotification(userId, req.user.id);
    
    return result;
  }

  // Удалить из друзей (отписаться)
  @Delete('remove/:friendId')
  @HttpCode(HttpStatus.OK)
  async removeFriend(@Param('friendId') friendId: string, @Req() req: any) {
    return this.friendsService.removeFriend(req.user.id, friendId);
  }

  // Получить входящие "запросы" = кто подписался на меня, но я не подписан на них
  @Get('incoming')
  async getIncomingRequests(@Req() req: any) {
    return this.friendsService.getIncomingRequests(req.user.id);
  }

  // Получить список друзей = взаимные подписки
  @Get('list')
  async getFriends(@Req() req: any) {
    return this.friendsService.getFriends(req.user.id);
  }

  // Получить статус подписки/дружбы
  @Get('status/:userId')
  async getFriendshipStatus(@Param('userId') userId: string, @Req() req: any) {
    return this.friendsService.getFriendshipStatus(req.user.id, userId);
  }
}
