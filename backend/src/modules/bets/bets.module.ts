import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';
import { Bet } from '../../entities/bet.entity';
import { Tournament } from '../../entities/tournament.entity';
import { Participant } from '../../entities/participant.entity';
import { WalletModule } from '../wallet/wallet.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bet, Tournament, Participant]),
    WalletModule,
    ChatModule,
  ],
  controllers: [BetsController],
  providers: [BetsService],
  exports: [BetsService],
})
export class BetsModule {}
