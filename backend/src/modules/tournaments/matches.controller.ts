import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Matches')
@Controller('tournaments/:tournamentId/matches')
export class MatchesController {
  constructor(private tournamentsService: TournamentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get matches for a tournament' })
  getMatches(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.tournamentsService.getMatches(tournamentId);
  }

  @Put(':matchId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update match details (organizer only)' })
  updateMatch(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentUser('id') userId: string,
    @Body() data: {
      team1Name?: string;
      team2Name?: string;
      team1Odds?: number;
      team2Odds?: number;
      winnerSide?: number;
    },
  ) {
    return this.tournamentsService.updateMatch(tournamentId, matchId, userId, data);
  }
}
