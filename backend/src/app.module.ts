import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { BetsModule } from './modules/bets/bets.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TeamsModule } from './modules/teams/teams.module';
import { FriendsModule } from './modules/friends/friends.module';
import { ChatModule } from './modules/chat/chat.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AccountModule } from './modules/account/account.module';
import { User } from './entities/user.entity';
import { Tournament } from './entities/tournament.entity';
import { Participant } from './entities/participant.entity';
import { Bet } from './entities/bet.entity';
import { Transaction } from './entities/transaction.entity';
import { SavedTournament } from './entities/saved-tournament.entity';
import { OnboardingAnswer } from './entities/onboarding-answer.entity';
import { PlayerStats } from './entities/player-stats.entity';
import { Follow } from './entities/follow.entity';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { TeamJoinRequest } from './entities/team-join-request.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { Friendship } from './entities/friendship.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { Message } from './entities/message.entity';
import { TournamentView } from './entities/tournament-view.entity';
import { ProfileView } from './entities/profile-view.entity';
import { TournamentReport } from './entities/tournament-report.entity';
import { PrivacySettings } from './entities/privacy-settings.entity';
import { NotificationSettings } from './entities/notification-settings.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { BlockedUser } from './entities/blocked-user.entity';
import { Match } from './entities/match.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Глобальный rate limiting: 100 запросов в минуту
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 секунд
        limit: 100, // 100 запросов
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USER', 'arena_user'),
        password: configService.get('DB_PASSWORD', 'arena_secret_password'),
        database: configService.get('DB_NAME', 'underground_arena'),
        entities: [User, Tournament, Participant, Bet, Transaction, OnboardingAnswer, SavedTournament, PlayerStats, Follow, Team, TeamMember, TeamJoinRequest, FriendRequest, Friendship, ChatRoom, Message, TournamentView, ProfileView, TournamentReport, PrivacySettings, NotificationSettings, UserPreferences, BlockedUser, Match],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
        ssl: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    TournamentsModule,
    ParticipantsModule,
    BetsModule,
    WalletModule,
    TeamsModule,
    FriendsModule,
    ChatModule,
    SettingsModule,
    AccountModule,
  ],
  providers: [
    // Глобальный guard для rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
