import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { Tournament } from '../../entities/tournament.entity';
import { SavedTournament } from '../../entities/saved-tournament.entity';
import { TournamentView } from '../../entities/tournament-view.entity';
import { TournamentReport } from '../../entities/tournament-report.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, SavedTournament, TournamentView, TournamentReport, User])],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
