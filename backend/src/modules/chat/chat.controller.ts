import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  async getRooms(@Req() req: any) {
    return this.chatService.getUserRooms(req.user.id);
  }

  @Post('room/:userId')
  async getOrCreateRoom(@Param('userId') userId: string, @Req() req: any) {
    return this.chatService.getOrCreateRoom(req.user.id, userId);
  }

  @Get('room/:roomId')
  async getRoom(@Param('roomId') roomId: string, @Req() req: any) {
    return this.chatService.getRoom(roomId, req.user.id);
  }

  @Get('room/:roomId/messages')
  async getMessages(@Param('roomId') roomId: string, @Req() req: any) {
    await this.chatService.markMessagesAsRead(roomId, req.user.id);
    return this.chatService.getMessages(roomId, req.user.id);
  }
}
