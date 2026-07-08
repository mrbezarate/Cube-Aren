import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreatePostDto, CreateCommentDto, ListPostsQueryDto } from './dto/community.dto';

@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Список постов (публичный, лайки подсвечиваются если авторизован)
  @Get('posts')
  @UseGuards(OptionalJwtAuthGuard)
  listPosts(@Query() query: ListPostsQueryDto, @Req() req: any) {
    return this.communityService.listPosts(query, req.user?.id);
  }

  // Статистика по игровым доскам
  @Get('boards')
  getBoardsStats() {
    return this.communityService.getBoardsStats();
  }

  // Один пост (+1 просмотр)
  @Get('posts/:id')
  @UseGuards(OptionalJwtAuthGuard)
  getPost(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.communityService.getPost(id, req.user?.id);
  }

  // Создать пост
  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  createPost(@Body() dto: CreatePostDto, @Req() req: any) {
    return this.communityService.createPost(req.user.id, dto);
  }

  // Удалить пост (автор или админ)
  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  deletePost(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.communityService.deletePost(req.user.id, id, req.user.role);
  }

  // Лайк/анлайк поста
  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  togglePostLike(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.communityService.togglePostLike(req.user.id, id);
  }

  // Комментарии поста
  @Get('posts/:id/comments')
  @UseGuards(OptionalJwtAuthGuard)
  listComments(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.communityService.listComments(id, req.user?.id);
  }

  // Добавить комментарий
  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  createComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.communityService.createComment(req.user.id, id, dto);
  }

  // Удалить комментарий (автор или админ)
  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  deleteComment(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.communityService.deleteComment(req.user.id, id, req.user.role);
  }

  // Лайк/анлайк комментария
  @Post('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  toggleCommentLike(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.communityService.toggleCommentLike(req.user.id, id);
  }
}
