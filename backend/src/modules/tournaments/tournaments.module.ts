import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentsController } from './tournaments.controller';
import { MatchesController } from './matches.controller';
import { TournamentsService } from './tournaments.service';
import { Tournament } from '../../entities/tournament.entity';
import { SavedTournament } from '../../entities/saved-tournament.entity';
import { TournamentView } from '../../entities/tournament-view.entity';
import { TournamentReport } from '../../entities/tournament-report.entity';
import { User } from '../../entities/user.entity';
import { Match } from '../../entities/match.entity';
import { Bet } from '../../entities/bet.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament,
      SavedTournament,
      TournamentView,
      TournamentReport,
      User,
      Match,
      Bet,
    ]),
    WalletModule,
  ],
  controllers: [TournamentsController, MatchesController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
