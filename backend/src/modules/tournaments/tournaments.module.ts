import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { Tournament } from '../../entities/tournament.entity';
import { SavedTournament } from '../../entities/saved-tournament.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, SavedTournament])],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
