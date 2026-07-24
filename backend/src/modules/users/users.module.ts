import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/transaction.entity';
import { OnboardingAnswer } from '../../entities/onboarding-answer.entity';
import { PlayerStats } from '../../entities/player-stats.entity';
import { Follow } from '../../entities/follow.entity';
import { Team } from '../../entities/team.entity';
import { TeamMember } from '../../entities/team-member.entity';
import { ProfileView } from '../../entities/profile-view.entity';
import { PrivacySettings } from '../../entities/privacy-settings.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Transaction,
      OnboardingAnswer,
      PlayerStats,
      Follow,
      Team,
      TeamMember,
      ProfileView,
      PrivacySettings,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
