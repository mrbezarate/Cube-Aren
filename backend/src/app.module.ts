import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { BetsModule } from './modules/bets/bets.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TeamsModule } from './modules/teams/teams.module';
import { FriendsModule } from './modules/friends/friends.module';
import { ChatModule } from './modules/chat/chat.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USER', 'arena_user'),
        password: configService.get('DB_PASSWORD', 'arena_secret_password'),
        database: configService.get('DB_NAME', 'underground_arena'),
        entities: [User, Tournament, Participant, Bet, Transaction, OnboardingAnswer, SavedTournament, PlayerStats, Follow, Team, TeamMember, TeamJoinRequest, FriendRequest, Friendship, ChatRoom, Message],
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
  ],
})
export class AppModule {}
