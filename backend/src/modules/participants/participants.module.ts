import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { Participant } from '../../entities/participant.entity';
import { Tournament } from '../../entities/tournament.entity';
import { WalletModule } from '../wallet/wallet.module';
import { BetsModule } from '../bets/bets.module';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Participant, Tournament]),
    WalletModule,
    BetsModule,
    UsersModule,
    ChatModule,
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
