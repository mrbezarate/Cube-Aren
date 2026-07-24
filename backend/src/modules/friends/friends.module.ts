import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { Follow } from '../../entities/follow.entity';
import { User } from '../../entities/user.entity';
import { PrivacySettings } from '../../entities/privacy-settings.entity';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Follow, User, PrivacySettings]),
    forwardRef(() => ChatModule),
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
