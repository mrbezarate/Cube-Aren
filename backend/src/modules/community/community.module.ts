import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { CommunityPost } from '../../entities/community-post.entity';
import { CommunityComment } from '../../entities/community-comment.entity';
import {
  CommunityPostLike,
  CommunityCommentLike,
} from '../../entities/community-like.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommunityPost,
      CommunityComment,
      CommunityPostLike,
      CommunityCommentLike,
      User,
    ]),
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
