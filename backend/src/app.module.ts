import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { BetsModule } from './modules/bets/bets.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { User } from './entities/user.entity';
import { Tournament } from './entities/tournament.entity';
import { Participant } from './entities/participant.entity';
import { Bet } from './entities/bet.entity';
import { Transaction } from './entities/transaction.entity';
import { OnboardingAnswer } from './entities/onboarding-answer.entity';

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
        entities: [User, Tournament, Participant, Bet, Transaction, OnboardingAnswer],
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
  ],
})
export class AppModule {}
