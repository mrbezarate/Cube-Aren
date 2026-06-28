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
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Friends')
@Controller('friends')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request/:userId')
  async sendFriendRequest(@Param('userId') userId: string, @Req() req: any) {
    return this.friendsService.sendFriendRequest(req.user.id, userId);
  }

  @Post('accept/:requestId')
  async acceptFriendRequest(@Param('requestId') requestId: string, @Req() req: any) {
    return this.friendsService.acceptFriendRequest(requestId, req.user.id);
  }

  @Post('reject/:requestId')
  async rejectFriendRequest(@Param('requestId') requestId: string, @Req() req: any) {
    return this.friendsService.rejectFriendRequest(requestId, req.user.id);
  }

  @Delete('cancel/:requestId')
  @HttpCode(HttpStatus.OK)
  async cancelFriendRequest(@Param('requestId') requestId: string, @Req() req: any) {
    return this.friendsService.cancelFriendRequest(requestId, req.user.id);
  }

  @Delete('remove/:friendId')
  @HttpCode(HttpStatus.OK)
  async removeFriend(@Param('friendId') friendId: string, @Req() req: any) {
    return this.friendsService.removeFriend(req.user.id, friendId);
  }

  @Get('incoming')
  async getIncomingRequests(@Req() req: any) {
    return this.friendsService.getIncomingRequests(req.user.id);
  }

  @Get('outgoing')
  async getOutgoingRequests(@Req() req: any) {
    return this.friendsService.getOutgoingRequests(req.user.id);
  }

  @Get('list')
  async getFriends(@Req() req: any) {
    return this.friendsService.getFriends(req.user.id);
  }

  @Get('status/:userId')
  async getFriendshipStatus(@Param('userId') userId: string, @Req() req: any) {
    return this.friendsService.getFriendshipStatus(req.user.id, userId);
  }
}
